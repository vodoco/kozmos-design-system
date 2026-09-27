import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function findDotEnv(startDir) {
    let current = startDir;
    while (true) {
        const candidate = path.join(current, '.env');
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

    for (const line of fs.readFileSync(filePath, 'utf-8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match) continue;

        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        values[match[1]] = value;
    }

    return values;
}

function normalizeParseArgs(args, workspaceRoot) {
    const normalized = args.filter((arg) => arg !== '--');
    const configIndex = normalized.indexOf('--config');
    const configPath = normalized[configIndex + 1];

    if (configIndex !== -1 && configPath && !path.isAbsolute(configPath)) {
        normalized[configIndex + 1] = path.resolve(workspaceRoot, configPath);
    }

    return normalized;
}

const dotEnvValues = parseDotEnv(findDotEnv(process.cwd()));
const env = { ...dotEnvValues, ...process.env };
const workspaceFile = findUp(process.cwd(), 'pnpm-workspace.yaml');
const workspaceRoot = workspaceFile ? path.dirname(workspaceFile) : process.cwd();
const parseArgs = normalizeParseArgs(process.argv.slice(2), workspaceRoot);

const result = spawnSync('pnpm', ['--filter', '@kozmos-ds/react', 'exec', 'figma', 'connect', 'parse', ...parseArgs], {
    stdio: 'inherit',
    env,
    cwd: workspaceRoot,
});

process.exit(result.status ?? 1);
