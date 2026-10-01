/**
 * Nothing outside the record still calls the packages `@kozmos/`.
 *
 * The rename to `@kozmos-ds/` was a search and replace over 247 files, recorded
 * as a diff. A diff cannot know about a file written after it: this branch adds
 * eight, four of them changesets whose frontmatter names the package
 * `changeset version` looks up, and one of them `ci.yml`, whose turbo filters
 * would stop matching anything. So the rename is verified rather than trusted.
 *
 * `.ai-skills/` and `docs/project-scope.md` were left as they were until
 * 2026-09-29, because renaming them meant a reformat of their broken nested
 * fences. Both are renamed now: the knowledge base's fences were repaired
 * first, and Prettier leaves the project scope as it is. Nothing is excused
 * but the two files below, which must spell the old scope to look for it.
 */
import { execFileSync } from "node:child_process";

const ALLOWED = [
  // This file, which has to name the thing it is looking for — in the pattern
  // it greps with and in the prose above. It passed until it was committed,
  // because `git grep` only reads tracked files: a check that cannot see itself
  // is a check with a blind spot at its centre.
  /^scripts\/check-package-scope\.mjs$/,
  // The test that `pnpm skills:check` refuses the old scope in AI-facing
  // code: it has to write the import it refuses.
  /^scripts\/skills\/ai-snippets\.test\.mjs$/,
];

// `--untracked` as well: a file introduced by the change being checked is not
// tracked yet when it is run by hand, and a check that only sees what is
// already committed reports a clean tree right up until the commit lands.
const files = execFileSync(
  "git",
  ["grep", "-l", "--untracked", "@kozmos/", "--", "."],
  {
    encoding: "utf8",
  },
)
  .split("\n")
  .filter(Boolean);

const unexpected = files.filter((f) => !ALLOWED.some((r) => r.test(f)));
console.log(
  `Package scope\n\n  ${files.length} file(s) mention @kozmos/; ${files.length - unexpected.length} are records the rename left alone.\n`,
);
for (const f of unexpected) {
  const hits = execFileSync(
    "git",
    ["grep", "-c", "--untracked", "@kozmos/", "--", f],
    { encoding: "utf8" },
  ).trim();
  console.log(`  FAIL  ${hits.split(":").pop()} reference(s) in ${f}`);
}
if (!unexpected.length)
  console.log("  ok    only the records still say @kozmos/");
process.exitCode = unexpected.length ? 1 : 0;
