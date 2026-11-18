// GAP-234: one analytics event table for every platform. Each event a
// part sends is in docs/analytics-events.json, and on React, SwiftUI and
// Compose it is either "sent" or the table says why it is not. This fails
// when a platform's source sends an event the table does not mark sent
// there (a new or renamed event), or the table marks one sent that the
// source no longer sends (a dropped or renamed one).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  readCompose,
  readReact,
  readSwiftUI,
} from "./analytics/read-events.mjs";

const root =
  process.env.KOZMOS_ANALYTICS_ROOT ??
  fileURLToPath(new URL("../", import.meta.url));
const table = JSON.parse(
  readFileSync(
    new URL("../docs/analytics-events.json", import.meta.url),
    "utf8",
  ),
).events;
const platforms = {
  react: ["React", readReact(root)],
  swiftui: ["SwiftUI", readSwiftUI(root)],
  compose: ["Compose", readCompose(root)],
};

const problems = [];
for (const [key, [label, sent]] of Object.entries(platforms)) {
  // A platform that reads no events, or almost none, is a reader that
  // skipped its sources (as every one did in CI's /__w/ workspace), never a
  // platform that sends nothing: this alone fails the check.
  if (sent.size < 10)
    problems.push(
      `${label}: read only ${sent.size} events from ${root}; the reader skipped its sources, so nothing else said about ${label} here can be trusted.`,
    );
  for (const [name, { files }] of sent) {
    const row = table[name];
    if (!row)
      problems.push(
        `${label} sends ${name} (${[...files].join(", ")}), which the table does not list.`,
      );
    else if (row[key] !== "sent")
      problems.push(
        `${label} sends ${name} (${[...files].join(", ")}), which the table says it does not: "${row[key]}"`,
      );
  }
  for (const [name, row] of Object.entries(table)) {
    if (row[key] === "sent" && !sent.has(name))
      problems.push(
        `The table says ${label} sends ${name}, and its source sends no such event.`,
      );
    else if (
      row[key] !== "sent" &&
      !(typeof row[key] === "string" && row[key].trim())
    )
      problems.push(`${name} on ${label}: neither "sent" nor a reason.`);
  }
}
for (const [name, row] of Object.entries(table))
  if (!Object.keys(platforms).some((key) => row[key] === "sent"))
    problems.push(`${name} is sent on no platform: take it out of the table.`);

if (problems.length) {
  console.error(
    `Analytics parity (GAP-234): ${problems.length} problem(s)\n- ${problems.join("\n- ")}`,
  );
  process.exit(1);
}
const counts = Object.entries(platforms)
  .map(([, [label, sent]]) => `${label} ${sent.size}`)
  .join(", ");
console.log(
  `Analytics parity (GAP-234): ${Object.keys(table).length} events in the table; sent by ${counts}; every other cell says why.`,
);
