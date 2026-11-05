import { runFigmaConnect } from "./lib/figma-connect-run.mjs";
import fs from "node:fs";
import path from "node:path";

const PLATFORMS = {
  ios: {
    dir: "packages/ios",
    config: "packages/ios/figma.linked.config.json",
  },
  android: {
    dir: "packages/android",
    config: "packages/android/figma.linked.config.json",
  },
};

const COMMANDS = new Set(["parse", "publish", "unpublish"]);

function usage() {
  console.error(
    "Usage: node scripts/figma-connect-native.mjs <ios|android> <parse|publish|unpublish> [...figma args]",
  );
}

function findDotEnv(startDir) {
  let current = startDir;
  for (;;) {
    const candidate = path.join(current, ".env");
    if (fs.existsSync(candidate)) return candidate;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function findUp(startDir, fileName) {
  let current = startDir;
  for (;;) {
    const candidate = path.join(current, fileName);
    if (fs.existsSync(candidate)) return candidate;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function parseDotEnv(filePath) {
  const values = {};

  if (!filePath) return values;

  for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[match[1]] = value;
  }

  return values;
}

function findPlaceholderFiles(platformDir, configPath) {
  if (!fs.existsSync(configPath)) return [];

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const include = config.codeConnect?.include || [];

  return include
    .filter((includePath) => /\.(figma\.(swift|kt))$/.test(includePath))
    .map((includePath) => path.resolve(platformDir, includePath))
    .filter((filePath) => fs.existsSync(filePath))
    .filter((filePath) =>
      /node-id=TBD|nodeId\s*=\s*["']TBD["']|node-id%3DTBD/.test(
        fs.readFileSync(filePath, "utf-8"),
      ),
    );
}

const [platformName, command, ...extraArgs] = process.argv
  .slice(2)
  .filter((arg) => arg !== "--");
const platform = PLATFORMS[platformName];

if (!platform || !COMMANDS.has(command)) {
  usage();
  process.exit(1);
}

const workspaceFile = findUp(process.cwd(), "pnpm-workspace.yaml");
const workspaceRoot = workspaceFile
  ? path.dirname(workspaceFile)
  : process.cwd();
const dotEnvValues = parseDotEnv(findDotEnv(process.cwd()));
const env = { ...dotEnvValues, ...process.env };

const dir = path.resolve(workspaceRoot, platform.dir);
const config = path.resolve(workspaceRoot, platform.config);
const figmaBin = path.resolve(
  workspaceRoot,
  "packages/react/node_modules/.bin/figma",
);

if (command === "publish") {
  const placeholderFiles = findPlaceholderFiles(dir, config);
  if (placeholderFiles.length > 0) {
    console.error(
      "Code Connect publish blocked: placeholder Figma node IDs remain.",
    );
    console.error(
      "Replace node-id=TBD with real published component node IDs before running publish.",
    );
    for (const filePath of placeholderFiles) {
      console.error(`- ${path.relative(workspaceRoot, filePath)}`);
    }
    process.exit(1);
  }
}

if (!fs.existsSync(figmaBin)) {
  console.error(
    "Figma Code Connect CLI was not found at packages/react/node_modules/.bin/figma.",
  );
  console.error(
    "Run pnpm install before using the native Code Connect scripts.",
  );
  process.exit(1);
}

process.exit(
  await runFigmaConnect(
    figmaBin,
    [
      "connect",
      command,
      "--config",
      config,
      "--skip-update-check",
      "--exit-on-unreadable-files",
      ...extraArgs,
    ],
    { env, cwd: dir },
  ),
);
