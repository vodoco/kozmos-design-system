// Read-only: asks Figma's Dev Mode MCP server which variables a node uses and their values.
const SERVER = "http://127.0.0.1:3845/mcp";
let session = null, nextId = 1;
async function rpc(method, params, notification = false) {
  const headers = { "content-type": "application/json", accept: "application/json, text/event-stream" };
  if (session) headers["mcp-session-id"] = session;
  const body = notification ? { jsonrpc: "2.0", method, params } : { jsonrpc: "2.0", id: nextId++, method, params };
  const response = await fetch(SERVER, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  session = response.headers.get("mcp-session-id") || session;
  const text = await response.text();
  if (notification) return null;
  const events = text.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
  return JSON.parse(events.length ? events[events.length - 1] : text);
}
await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "kozmos-variable-read", version: "1.0.0" } });
await rpc("notifications/initialized", {}, true);
const tools = await rpc("tools/list", {});
console.log("tools:", (tools.result?.tools || []).map((t) => t.name).join(", "));
for (const nodeId of process.argv.slice(2)) {
  const reply = await rpc("tools/call", { name: "get_variable_defs", arguments: { nodeId, clientLanguages: "javascript", clientFrameworks: "react" } });
  const text = (reply.result?.content || []).map((p) => p.text || "").join("");
  console.log(nodeId, reply.error ? JSON.stringify(reply.error).slice(0, 200) : text.slice(0, 1500));
}
