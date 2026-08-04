import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Octokit } from '@octokit/rest';

const MARKER = '<!-- gemini-pr-review -->';
const BOT_LOGIN = 'github-actions[bot]';
const MAX_CONTEXT_CHARS = 50_000;
const MAX_DIFF_CHARS = 60_000;
const MAX_FILE_CHARS = 8_000;
const MAX_INLINE_COMMENTS = 8;
const RATE_LIMIT_BACKOFF_MS = [15_000, 30_000, 45_000];
const DEFAULT_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'uploads',
  'data',
  'coverage',
  '.github/pr-review/node_modules',
]);
const CONTEXT_FILES = [
  'README.md',
  'package.json',
  'server/package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  '.env.example',
  'components.json',
];

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'number' },
    decision: { type: 'string', enum: ['APPROVE', 'REQUEST_CHANGES', 'NEEDS_DISCUSSION'] },
    justification: { type: 'string' },
    recommended_steps: { type: 'array', items: { type: 'string' } },
    inline_comments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          line: { type: 'number' },
          body: { type: 'string' },
        },
        required: ['file', 'line', 'body'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['score', 'decision', 'justification', 'recommended_steps', 'summary'],
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(text, maxChars, label = 'content') {
  if (!text || text.length <= maxChars) return text;
  const remaining = text.length - maxChars;
  return `${text.slice(0, maxChars)}\n\n[truncated ${remaining} chars from ${label}]`;
}

function shouldSkipPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (SKIP_DIRS.has(normalized)) return true;
  return normalized.split('/').some((part) => SKIP_DIRS.has(part));
}

function buildFileTree(dir, maxDepth, currentDepth = 0, prefix = '') {
  if (currentDepth >= maxDepth) return '';

  let output = '';
  let entries;

  try {
    entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  } catch {
    return '';
  }

  for (const entry of entries) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (shouldSkipPath(relPath)) continue;

    const indent = '  '.repeat(currentDepth);
    output += `${indent}${entry.name}${entry.isDirectory() ? '/' : ''}\n`;

    if (entry.isDirectory()) {
      output += buildFileTree(join(dir, entry.name), maxDepth, currentDepth + 1, relPath);
    }
  }

  return output;
}

function readContextFile(repoRoot, relPath) {
  const fullPath = join(repoRoot, relPath);
  if (!existsSync(fullPath)) return null;

  try {
    const stat = statSync(fullPath);
    if (!stat.isFile()) return null;
    const content = readFileSync(fullPath, 'utf8');
    return {
      path: relPath.replace(/\\/g, '/'),
      content: truncate(content, MAX_FILE_CHARS, relPath),
    };
  } catch {
    return null;
  }
}

function gatherProjectContext(repoRoot) {
  const sections = [];

  const tree = buildFileTree(repoRoot, 2);
  if (tree.trim()) {
    sections.push(`## File tree (depth 2)\n\`\`\`\n${tree.trim()}\n\`\`\``);
  }

  for (const relPath of CONTEXT_FILES) {
    const file = readContextFile(repoRoot, relPath);
    if (file) {
      sections.push(`## ${file.path}\n\`\`\`\n${file.content}\n\`\`\``);
    }
  }

  return truncate(sections.join('\n\n'), MAX_CONTEXT_CHARS, 'project context');
}

function buildPrompt({ pr, context, diff }) {
  return `You are an expert software engineer reviewing a GitHub pull request.

Analyze the PR diff against the repository context. Be specific, actionable, and concise.

## Scoring rubric
- Score 90-100: APPROVE — excellent quality, ready to merge
- Score 80-89: APPROVE — good quality with minor suggestions
- Score 60-79: NEEDS_DISCUSSION — meaningful issues that should be discussed before merge
- Score below 60: REQUEST_CHANGES — significant bugs, security issues, or missing tests

Set \`decision\` to match the rubric based on \`score\`.

## PR metadata
- Number: #${pr.number}
- Title: ${pr.title}
- Author: ${pr.user?.login ?? 'unknown'}
- Base: ${pr.base?.ref ?? 'unknown'} ← Head: ${pr.head?.ref ?? 'unknown'}

## Repository context
${context}

## Pull request diff
\`\`\`diff
${diff}
\`\`\`

## Output requirements
Return JSON only with this shape:
{
  "score": <number 0-100>,
  "decision": "APPROVE" | "REQUEST_CHANGES" | "NEEDS_DISCUSSION",
  "justification": "<why this score and decision>",
  "recommended_steps": ["<actionable step>", "..."],
  "inline_comments": [
    { "file": "<path/from/repo/root>", "line": <line number in new file>, "body": "<critical inline note>" }
  ],
  "summary": "<2-4 sentence overview>"
}

Rules:
- Include inline_comments only for critical issues (security, correctness, breaking changes). Max ${MAX_INLINE_COMMENTS} items.
- Line numbers must refer to the NEW file side of the diff.
- Do not invent files or issues not supported by the diff.
- recommended_steps must be concrete and ordered by priority.`;
}

function normalizeReview(raw) {
  const score = Math.max(0, Math.min(100, Math.round(Number(raw.score) || 0)));

  let decision = raw.decision;
  if (!['APPROVE', 'REQUEST_CHANGES', 'NEEDS_DISCUSSION'].includes(decision)) {
    if (score >= 80) decision = 'APPROVE';
    else if (score >= 60) decision = 'NEEDS_DISCUSSION';
    else decision = 'REQUEST_CHANGES';
  }

  const recommendedSteps = Array.isArray(raw.recommended_steps)
    ? raw.recommended_steps.filter((step) => typeof step === 'string' && step.trim())
    : [];

  const inlineComments = Array.isArray(raw.inline_comments)
    ? raw.inline_comments
        .filter(
          (item) =>
            item &&
            typeof item.file === 'string' &&
            Number.isFinite(Number(item.line)) &&
            typeof item.body === 'string' &&
            item.body.trim(),
        )
        .slice(0, MAX_INLINE_COMMENTS)
        .map((item) => ({
          file: item.file.replace(/\\/g, '/'),
          line: Math.max(1, Math.round(Number(item.line))),
          body: item.body.trim(),
        }))
    : [];

  return {
    score,
    decision,
    justification: String(raw.justification || 'No justification provided.').trim(),
    recommended_steps: recommendedSteps,
    inline_comments: inlineComments,
    summary: String(raw.summary || 'No summary provided.').trim(),
  };
}

function parseJsonResponse(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini response did not contain JSON');
    return JSON.parse(match[0]);
  }
}

function isRateLimitError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  const status = error?.status ?? error?.response?.status;
  return status === 429 || message.includes('429') || message.includes('rate limit');
}

async function callGeminiWithFallback({ apiKey, prompt, models }) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const errors = [];

  for (const modelName of models) {
    for (let attempt = 0; attempt <= RATE_LIMIT_BACKOFF_MS.length; attempt += 1) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: REVIEW_SCHEMA,
          },
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text) throw new Error(`Empty response from ${modelName}`);
        return { review: normalizeReview(parseJsonResponse(text)), modelName };
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        errors.push(`${modelName} (attempt ${attempt + 1}): ${detail}`);

        if (isRateLimitError(error) && attempt < RATE_LIMIT_BACKOFF_MS.length) {
          await sleep(RATE_LIMIT_BACKOFF_MS[attempt]);
          continue;
        }

        break;
      }
    }
  }

  throw new Error(`All Gemini models failed:\n${errors.join('\n')}`);
}

function formatReviewComment(review, modelName) {
  const steps =
    review.recommended_steps.length > 0
      ? review.recommended_steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
      : '_None_';

  return [
    '## 🤖 PR Review',
    '',
    MARKER,
    '',
    `**Score:** ${review.score} / 100`,
    `**Decision:** ${review.decision}`,
    '',
    '### Summary',
    review.summary,
    '',
    '### Justification',
    review.justification,
    '',
    '### Recommended steps',
    steps,
    '',
    '---',
    `*Automated review by Gemini (${modelName}) via GitHub Actions*`,
  ].join('\n');
}

function formatFailureComment(errorMessage) {
  return [
    '## 🤖 PR Review',
    '',
    MARKER,
    '',
    '**Status:** Review failed',
    '',
    'The automated Gemini review could not be completed.',
    '',
    '```',
    errorMessage.slice(0, 2000),
    '```',
    '',
    '---',
    '*Automated review by Gemini via GitHub Actions*',
  ].join('\n');
}

async function upsertSummaryComment(octokit, owner, repo, prNumber, body) {
  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  });

  const existing = comments.find(
    (comment) => comment.user?.login === BOT_LOGIN && comment.body?.includes(MARKER),
  );

  if (existing) {
    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    return existing.id;
  }

  const { data: created } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
  return created.id;
}

async function postInlineComments(octokit, owner, repo, prNumber, headSha, inlineComments) {
  for (const comment of inlineComments) {
    try {
      await octokit.pulls.createReviewComment({
        owner,
        repo,
        pull_number: prNumber,
        commit_id: headSha,
        path: comment.file,
        line: comment.line,
        side: 'RIGHT',
        body: `**Gemini review:** ${comment.body}`,
      });
    } catch {
      // Skip comments that cannot be anchored (line not in diff, etc.)
    }
  }
}

async function main() {
  const apiKey = requireEnv('GEMINI_API_KEY');
  const token = requireEnv('GITHUB_TOKEN');
  const repository = requireEnv('GITHUB_REPOSITORY');
  const prNumber = Number(requireEnv('PR_NUMBER'));
  const repoRoot = process.env.REPO_ROOT || process.cwd();

  if (!Number.isFinite(prNumber) || prNumber <= 0) {
    throw new Error(`Invalid PR_NUMBER: ${process.env.PR_NUMBER}`);
  }

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`);
  }

  const models = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...DEFAULT_MODELS.filter((m) => m !== process.env.GEMINI_MODEL)]
    : DEFAULT_MODELS;

  const octokit = new Octokit({ auth: token });

  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  const diffResponse = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: 'diff' },
  });

  const diff = truncate(String(diffResponse.data), MAX_DIFF_CHARS, 'PR diff');
  const context = gatherProjectContext(repoRoot);
  const prompt = buildPrompt({ pr, context, diff });

  try {
    const { review, modelName } = await callGeminiWithFallback({ apiKey, prompt, models });
    const commentBody = formatReviewComment(review, modelName);
    await upsertSummaryComment(octokit, owner, repo, prNumber, commentBody);

    if (review.inline_comments.length > 0 && pr.head?.sha) {
      await postInlineComments(
        octokit,
        owner,
        repo,
        prNumber,
        pr.head.sha,
        review.inline_comments,
      );
    }

    console.log(`Review posted for PR #${prNumber} using ${modelName}`);
    console.log(`Score: ${review.score}, Decision: ${review.decision}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await upsertSummaryComment(octokit, owner, repo, prNumber, formatFailureComment(message));
    console.error(message);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
