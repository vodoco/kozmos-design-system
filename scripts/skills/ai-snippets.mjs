/**
 * Tests first: today's line-by-line checks of `.ai-skills` code, moved from
 * check-ai-skills.mjs behind the interface the new tests call, so that they
 * can be seen to fail against it. The next commit replaces it. (A regex's
 * exec() is written as String.match(), which is the same call for a
 * non-global pattern.)
 */
export function checkDocuments(root, docs, facts) {
  const problems = [];
  for (const { file, text } of docs)
    text.split("\n").forEach((line, index) => {
      const at = index + 1;
      const fail = (message) => problems.push({ file, line: at, message });
      const tag = line.match(/<([A-Z]\w+)([^>]*)>/);
      if (tag && facts.axes.has(tag[1])) {
        const declared = facts.axes.get(tag[1]);
        for (const axis of Object.keys(declared)) {
          const attr = tag[2].match(
            new RegExp(`(?<!:)\\b${axis}=["']([\\w-]+)["']`),
          );
          if (attr && !declared[axis].includes(attr[1]))
            fail(
              `<${tag[1]} ${axis}="${attr[1]}"> — ${tag[1]} declares ${axis}: ${declared[axis].join(" | ")}`,
            );
        }
      }
      const imports = line.match(
        /import\s*\{([^}]+)\}\s*from\s*["']@kozmos-ds\/react["']/,
      );
      if (imports)
        for (const raw of imports[1].split(",")) {
          const name = raw
            .trim()
            .replace(/^type\s+/, "")
            .split(/\s+as\s+/)[0];
          if (!name || !/^[A-Z]/.test(name)) continue;
          if (!facts.exportsOfReact.has(name))
            fail(
              `imports ${name} from @kozmos-ds/react, which does not export it`,
            );
        }
    });
  return problems;
}
