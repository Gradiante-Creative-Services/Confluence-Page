import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Octokit } from '@octokit/rest';

const MARKER = '<!-- gemini-pr-review -->';
const BOT_LOGIN = 'github-actions[bot]';
const CONTEXT_LIMIT = 50_000;
const DIFF_LIMIT = 60_000;
const FILE_LIMIT = 8_000;
const INLINE_CAP = 10;
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'data',
  'dist',
  'coverage',
  '.cursor',
]);
const CONFIG_FILES = [
  'README.md',
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'server/tsconfig.json',
  '.oxlintrc.json',
  'server/openapi.yaml',
  '.env.example',
];
const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];
const RATE_LIMIT_BACKOFF_MS = [15_000, 30_000, 45_000];

const REVIEW_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    score: { type: SchemaType.NUMBER, description: 'Overall score from 0 to 100' },
    decision: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['APPROVE', 'REQUEST_CHANGES', 'NEEDS_DISCUSSION'],
    },
    justification: { type: SchemaType.STRING },
    recommended_steps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    inline_comments: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          file: { type: SchemaType.STRING },
          line: { type: SchemaType.NUMBER },
          body: { type: SchemaType.STRING },
        },
        required: ['file', 'line', 'body'],
      },
    },
    summary: { type: SchemaType.STRING },
  },
  required: [
    'score',
    'decision',
    'justification',
    'recommended_steps',
    'inline_comments',
    'summary',
  ],
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

function truncate(text, limit) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n…[truncated]`;
}

function isRateLimited(error) {
  const status = error?.status ?? error?.response?.status ?? error?.httpStatusCode;
  if (status === 429) return true;
  const message = String(error?.message ?? error ?? '');
  return /\b429\b|rate.?limit|quota|resource.?exhausted/i.test(message);
}

function walkTree(dir, root, depth, maxDepth, lines) {
  if (depth > maxDepth) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    const rel = relative(root, full).replaceAll('\\', '/');
    const indent = '  '.repeat(depth);
    if (entry.isDirectory()) {
      lines.push(`${indent}${rel}/`);
      walkTree(full, root, depth + 1, maxDepth, lines);
    } else if (entry.isFile()) {
      lines.push(`${indent}${rel}`);
    }
  }
}

function gatherFileTree(repoRoot) {
  const lines = ['.'];
  walkTree(repoRoot, repoRoot, 1, 2, lines);
  return lines.join('\n');
}

function gatherProjectContext(repoRoot) {
  const parts = [];
  parts.push('## File tree (depth 2)\n```\n' + gatherFileTree(repoRoot) + '\n```');

  for (const rel of CONFIG_FILES) {
    const full = join(repoRoot, rel);
    try {
      if (!statSync(full).isFile()) continue;
      const body = truncate(readFileSync(full, 'utf8'), FILE_LIMIT);
      parts.push(`## ${rel}\n\`\`\`\n${body}\n\`\`\``);
    } catch {
      // skip missing files
    }
  }

  return truncate(parts.join('\n\n'), CONTEXT_LIMIT);
}

function buildDiff(files) {
  const chunks = [];
  for (const file of files) {
    const header = [
      `diff --git a/${file.filename} b/${file.filename}`,
      `--- a/${file.filename}`,
      `+++ b/${file.filename}`,
      `status: ${file.status}`,
    ].join('\n');
    const patch = file.patch ? `\n${file.patch}` : '\n[binary or empty patch]';
    chunks.push(header + patch);
  }
  return truncate(chunks.join('\n\n'), DIFF_LIMIT);
}

function buildPrompt({ pr, context, diff }) {
  return `You are a senior code reviewer for this repository. Review the pull request thoroughly.

## Scoring rubric (apply strictly)
- 90–100 → decision APPROVE (excellent, minor or no issues)
- 80–89 → decision APPROVE (good, small non-blocking nits only)
- 60–79 → decision NEEDS_DISCUSSION (meaningful concerns, discuss before merge)
- Below 60 → decision REQUEST_CHANGES (blocking issues)

## Focus areas
- Correctness and regressions
- Security (auth, secrets, injection, path traversal)
- API contracts and validation
- Tests and maintainability
- Consistency with existing project patterns

## Inline comments
Only include inline_comments for **critical** issues on changed lines.
Each entry needs file (repo-relative path), line (new-file line number from the diff), and body.
Omit inline_comments (empty array) when there are no critical line-level issues.
Do not include external repo links or branding.

## Pull request
Title: ${pr.title}
Body:
${pr.body || '(empty)'}

## Project context
${context}

## Diff
${diff}

Respond with JSON matching the schema only.`;
}

async function callGeminiWithFallback(apiKey, prompt) {
  const models = process.env.GEMINI_MODELS
    ? process.env.GEMINI_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
    : DEFAULT_MODELS;

  const genAI = new GoogleGenerativeAI(apiKey);
  const errors = [];

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: REVIEW_SCHEMA,
        temperature: 0.2,
      },
    });

    for (let attempt = 0; attempt <= RATE_LIMIT_BACKOFF_MS.length; attempt++) {
      try {
        console.log(`Calling Gemini model ${modelName} (attempt ${attempt + 1})…`);
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);
        return { review: normalizeReview(parsed), modelUsed: modelName };
      } catch (error) {
        const msg = error?.message ?? String(error);
        console.warn(`Model ${modelName} failed: ${msg}`);
        if (isRateLimited(error) && attempt < RATE_LIMIT_BACKOFF_MS.length) {
          const wait = RATE_LIMIT_BACKOFF_MS[attempt];
          console.warn(`Rate limited; waiting ${wait / 1000}s before retry…`);
          await sleep(wait);
          continue;
        }
        errors.push(`${modelName}: ${msg}`);
        break;
      }
    }
  }

  throw new Error(`All Gemini models failed:\n${errors.join('\n')}`);
}

function normalizeReview(raw) {
  const score = Number(raw.score);
  let decision = String(raw.decision || '').toUpperCase();
  if (!['APPROVE', 'REQUEST_CHANGES', 'NEEDS_DISCUSSION'].includes(decision)) {
    if (score >= 80) decision = 'APPROVE';
    else if (score >= 60) decision = 'NEEDS_DISCUSSION';
    else decision = 'REQUEST_CHANGES';
  }

  const steps = Array.isArray(raw.recommended_steps)
    ? raw.recommended_steps.map(String).filter(Boolean)
    : [];

  const inline = Array.isArray(raw.inline_comments)
    ? raw.inline_comments
        .map((c) => ({
          file: String(c?.file ?? '').replaceAll('\\', '/'),
          line: Number(c?.line),
          body: String(c?.body ?? '').trim(),
        }))
        .filter((c) => c.file && Number.isFinite(c.line) && c.line > 0 && c.body)
        .slice(0, INLINE_CAP)
    : [];

  return {
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
    decision,
    justification: String(raw.justification ?? '').trim() || 'No justification provided.',
    recommended_steps: steps,
    inline_comments: inline,
    summary: String(raw.summary ?? '').trim() || 'No summary provided.',
  };
}

function formatCommentBody(review, modelUsed) {
  const steps =
    review.recommended_steps.length > 0
      ? review.recommended_steps.map((s) => `- ${s}`).join('\n')
      : '- None';

  return `${MARKER}
## 🤖 PR Review

**Score:** ${review.score}/100  
**Decision:** ${review.decision}

### Summary
${review.summary}

### Justification
${review.justification}

### Recommended steps
${steps}

_Model: ${modelUsed}_
`;
}

async function findExistingReviewComment(octokit, owner, repo, issueNumber) {
  const comments = await octokit.paginate(octokit.issues.listComments, {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });

  return comments.find(
    (c) => c.user?.login === BOT_LOGIN && typeof c.body === 'string' && c.body.includes(MARKER),
  );
}

async function upsertSummaryComment(octokit, { owner, repo, prNumber, body }) {
  const existing = await findExistingReviewComment(octokit, owner, repo, prNumber);
  if (existing) {
    console.log(`Updating existing review comment #${existing.id}`);
    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
    return;
  }
  console.log('Creating new review comment');
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}

async function postInlineComments(octokit, { owner, repo, prNumber, headSha, comments }) {
  if (!comments.length) {
    console.log('No inline comments to post');
    return;
  }

  try {
    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      commit_id: headSha,
      event: 'COMMENT',
      comments: comments.map((c) => ({
        path: c.file,
        line: c.line,
        body: c.body,
      })),
    });
    console.log(`Posted ${comments.length} inline review comment(s)`);
  } catch (error) {
    console.warn(
      `Failed to post inline comments (summary comment still published): ${error?.message ?? error}`,
    );
  }
}

async function main() {
  const apiKey = requireEnv('GEMINI_API_KEY');
  const token = requireEnv('GITHUB_TOKEN');
  const repository = requireEnv('GITHUB_REPOSITORY');
  const prNumber = Number(requireEnv('PR_NUMBER'));
  const repoRoot = requireEnv('REPO_ROOT');

  if (!Number.isFinite(prNumber) || prNumber <= 0) {
    throw new Error(`Invalid PR_NUMBER: ${process.env.PR_NUMBER}`);
  }

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY: ${repository}`);
  }

  const octokit = new Octokit({ auth: token });

  console.log(`Gathering context from ${repoRoot}`);
  const context = gatherProjectContext(repoRoot);

  console.log(`Fetching PR #${prNumber}`);
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  const files = await octokit.paginate(octokit.pulls.listFiles, {
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });
  const diff = buildDiff(files);
  console.log(`Diff size: ${diff.length} chars across ${files.length} file(s)`);

  const prompt = buildPrompt({ pr, context, diff });
  const { review, modelUsed } = await callGeminiWithFallback(apiKey, prompt);
  console.log(`Review complete via ${modelUsed}: score=${review.score} decision=${review.decision}`);

  const body = formatCommentBody(review, modelUsed);
  await upsertSummaryComment(octokit, { owner, repo, prNumber, body });
  await postInlineComments(octokit, {
    owner,
    repo,
    prNumber,
    headSha: pr.head.sha,
    comments: review.inline_comments,
  });

  console.log('Done');
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exit(1);
});
