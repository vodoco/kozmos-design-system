import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function findDotEnv(startDir) {
  let current = startDir;
  while (true) {
    const candidate = path.join(current, ".env");
    if (fs.existsSync(candidate)) return candidate;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function findUp(startDir, fileName) {
  let current = startDir;
  while (true) {
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

function findFiles(dir, predicate, output = []) {
  if (!fs.existsSync(dir)) return output;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(entryPath, predicate, output);
    } else if (predicate(entryPath)) {
      output.push(entryPath);
    }
  }

  return output;
}

function readPublishConfig(configPath) {
  if (!configPath || !fs.existsSync(configPath)) return [];

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return config.codeConnect?.include || [];
}

function resolveConfigInclude(workspaceRoot, configPath, includePath) {
  const candidates = [
    path.resolve(path.dirname(configPath), includePath),
    path.resolve(workspaceRoot, includePath),
    path.resolve(workspaceRoot, "packages/react", includePath),
  ];

  return (
    candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0]
  );
}

function expandConfigInclude(workspaceRoot, configPath, includePath) {
  if (!includePath.includes("*")) {
    return [resolveConfigInclude(workspaceRoot, configPath, includePath)];
  }

  const starIndex = includePath.indexOf("*");
  const prefix = includePath.slice(0, starIndex);
  const basePrefix = prefix.includes("/")
    ? prefix.slice(0, prefix.lastIndexOf("/") + 1)
    : "";
  const suffix = includePath.slice(includePath.lastIndexOf("*") + 1);
  const baseCandidates = [
    path.resolve(path.dirname(configPath), basePrefix),
    path.resolve(workspaceRoot, basePrefix),
    path.resolve(workspaceRoot, "packages/react", basePrefix),
  ].filter((candidate) => fs.existsSync(candidate));

  return [
    ...new Set(
      baseCandidates.flatMap((baseDir) =>
        findFiles(baseDir, (filePath) => filePath.endsWith(suffix)),
      ),
    ),
  ];
}

function findPlaceholderFiles(workspaceRoot, publishArgs) {
  const configIndex = publishArgs.indexOf("--config");
  const configPath = publishArgs[configIndex + 1];

  if (configIndex !== -1 && configPath) {
    return readPublishConfig(configPath)
      .filter((includePath) => includePath.endsWith(".figma.tsx"))
      .flatMap((includePath) =>
        expandConfigInclude(workspaceRoot, configPath, includePath),
      )
      .filter((filePath) => fs.existsSync(filePath))
      .filter((filePath) =>
        /node-id=TBD/i.test(fs.readFileSync(filePath, "utf-8")),
      );
  }

  const componentRoot = path.join(
    workspaceRoot,
    "packages/react/src/components",
  );
  return findFiles(componentRoot, (filePath) =>
    filePath.endsWith(".figma.tsx"),
  ).filter((filePath) =>
    /node-id=TBD/i.test(fs.readFileSync(filePath, "utf-8")),
  );
}

function normalizePublishArgs(args, workspaceRoot) {
  const normalized = args.filter((arg) => arg !== "--");
  const configIndex = normalized.indexOf("--config");
  const configPath = normalized[configIndex + 1];

  if (configIndex !== -1 && configPath && !path.isAbsolute(configPath)) {
    normalized[configIndex + 1] = path.resolve(workspaceRoot, configPath);
  }

  return normalized;
}

function blockPlaceholderPublishes(workspaceRoot, publishArgs) {
  if (process.env.FIGMA_ALLOW_PLACEHOLDER_PUBLISH === "true") return;
  const placeholderFiles = findPlaceholderFiles(workspaceRoot, publishArgs);

  if (placeholderFiles.length === 0) return;

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

const dotEnvValues = parseDotEnv(findDotEnv(process.cwd()));
const env = { ...dotEnvValues, ...process.env };
const workspaceFile = findUp(process.cwd(), "pnpm-workspace.yaml");
const workspaceRoot = workspaceFile
  ? path.dirname(workspaceFile)
  : process.cwd();
const publishArgs = normalizePublishArgs(process.argv.slice(2), workspaceRoot);

blockPlaceholderPublishes(workspaceRoot, publishArgs);

const result = spawnSync(
  "pnpm",
  [
    "--filter",
    "@kozmos-ds/react",
    "exec",
    "figma",
    "connect",
    "publish",
    ...publishArgs,
  ],
  {
    stdio: "inherit",
    env,
    cwd: workspaceRoot,
  },
);

process.exit(result.status ?? 1);
