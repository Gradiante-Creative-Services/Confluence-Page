async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  
  function collectPaths(toolInput) {
    if (!toolInput || typeof toolInput !== "object") return [];
    const values = [
      toolInput.path,
      toolInput.file_path,
      toolInput.filePath,
      toolInput.target_notebook,
      ...(Array.isArray(toolInput.paths) ? toolInput.paths : []),
    ];
    return values.filter((value) => typeof value === "string");
  }
  
  function pathContainsDotEnv(filePath) {
    return filePath.includes(".env");
  }
  
  function decide(payload) {
    const toolInput = payload.tool_input ?? payload.toolInput ?? {};
    const blocked = collectPaths(toolInput).some(pathContainsDotEnv);
    if (!blocked) {
      return { permission: "allow" };
    }
    return {
      permission: "deny",
      userMessage: "Edits to paths containing .env are blocked by a PreToolUse hook.",
      agentMessage:
        "Do not edit files whose path contains .env. The block fires before the file is touched.",
    };
  }
  
  const raw = await readStdin();
  let payload = {};
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    payload = {};
  }
  
  process.stdout.write(JSON.stringify(decide(payload)));