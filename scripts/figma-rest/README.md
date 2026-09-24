# Figma read tools

Read-only helpers for checking the live Kozmos Core Library (`Yj4O8p6Y9h2Sa9zJVoAiVY`) over the REST
API and Figma's Dev Mode MCP server. They were session tools on 2026-09-20 to 22 and are kept here
so a new session can verify an importer run without rebuilding them. None writes to Figma. None
prints the token.

Run them from the repository root, through the token wrapper:

```bash
scripts/figma-rest/with-figma-token.sh node scripts/figma-rest/stamps-all.mjs
```

`with-figma-token.sh` exports only `FIGMA_ACCESS_TOKEN`, read from the main checkout's `.env`
(`/Volumes/4TB Depo/development/K/kozmos-design-system-dev/.env`), and never prints it. If Node's
`fetch` fails on certificates, the session may have injected a missing `SSL_CERT_FILE`; run with
`SSL_CERT_FILE=/etc/ssl/cert.pem`. The token has no variables scope: `/variables/local` is 403.

| Tool                  | What it reads                                                                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stamps-all.mjs`      | The file's `lastModified` and every component set's importer build stamp, in the update sequence's order.                                                                                                                         |
| `figma-state.mjs`     | Which build each set carries against the current `PLUGIN_BUILD`, the newest sets, the last write.                                                                                                                                 |
| `published.mjs`       | When the library's component sets were last published.                                                                                                                                                                            |
| `icons-baseline.mjs`  | Every `Icon / *` on the Icons page with its source layer's id, written to the path given as the argument.                                                                                                                         |
| `icon-tints.mjs`      | Every icon in every set: tinted (its paint bound to a variable, as the importer lays it) or untinted (the tint laid through a redrawn source is gone). Exits 1 while any is untinted.                                             |
| `bindings.mjs <ids…>` | Every paint in the subtrees bound to a variable: its id, where it is, the colour the paint stores.                                                                                                                                |
| `render-node.mjs`     | `render-node.mjs <out-prefix> <ids…>`: PNG renders of nodes at 2×.                                                                                                                                                                |
| `modes.mjs <id>`      | A node's and its children's explicit variable modes.                                                                                                                                                                              |
| `replay-diff.mjs`     | `S=<dir> node … <old code.js> <new code.js>`: paints every capturable set with both builds and lists what differs; diffs go to `$S`. It reaches only sets painted through the shared updaters (Stepper, for one, paints its own). |
| `mcp-vars.mjs <ids…>` | Dev Mode MCP (`127.0.0.1:3845`): the variables a node uses. It answers only while Figma desktop is in front.                                                                                                                      |

Node ids are written `1351-8358` in URLs and `1351:8358` in the API; the tools take either.

**Over REST, a bound paint shows its stored colour, not its variable's.** The painter's fallback is
what the node JSON and a REST render show; on 2026-09-22 the island and LocationPin's ring, bound to
one variable, rendered two different fallbacks. Read `boundVariables` ids for what a node is bound
to, and check the variable in Figma.

## Checking the icon sources after a run

`docs/figma-icons-2026-09-22-0947Z.json` is the Icons page as it stands before the pending run
(`lastModified` 09:47:15Z: 64 icon components, 56 Pointr Sources and 8 taxonomy sources).
`docs/figma-icons-2026-09-22-0810Z.json` is the page before that, at 08:10:23Z; a Curated Icons →
Update at 09:47:15Z drew every one of its 56 sources anew and orphaned the tints laid through them
(the handoff of the 22nd, §5). After the next Curated Icons → Update, read the page again and
compare the source ids; every one should be kept:

```bash
scripts/figma-rest/with-figma-token.sh node scripts/figma-rest/icons-baseline.mjs /tmp/icons-after.json
node -e 'const [a,b]=process.argv.slice(1).map(f=>JSON.parse(require("fs").readFileSync(f,"utf8")));const ids=o=>new Set(o.icons.flatMap(i=>i.sources.map(s=>s.id)));const before=ids(a),after=ids(b);console.log("kept",[...before].filter(i=>after.has(i)).length,"of",before.size,"; new",[...after].filter(i=>!before.has(i)).length)' docs/figma-icons-2026-09-22-0947Z.json /tmp/icons-after.json
```

Then, after the Updates, every icon should be tinted again:

```bash
scripts/figma-rest/with-figma-token.sh node scripts/figma-rest/icon-tints.mjs
```
