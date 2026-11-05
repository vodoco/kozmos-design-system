/**
 * Rolls the Vue entry's declarations, written per file to dist/vue/.types by
 * vite.vue.config.mts, into dist/vue/index.d.ts with API Extractor, as
 * unplugin-dts rolls the React entry's into dist/index.d.ts. It cannot roll
 * these itself: it rolls into package.json's `types`, which is React's.
 *
 * The roll must name no React: every icon there is a Vue functional
 * component. The build fails if it does.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const typesDir = path.join(packageDir, "dist/vue/.types");
const rolled = path.join(packageDir, "dist/vue/index.d.ts");

// The same settings unplugin-dts gives API Extractor for the React entry.
const config = ExtractorConfig.prepare({
  configObject: {
    projectFolder: packageDir,
    mainEntryPointFilePath: path.join(typesDir, "index.d.ts"),
    bundledPackages: [],
    compiler: {
      overrideTsconfig: {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          strict: true,
          skipLibCheck: true,
        },
        files: [path.join(typesDir, "index.d.ts")],
      },
    },
    apiReport: { enabled: false, reportFileName: "<unscopedPackageName>.api.md" },
    docModel: { enabled: false },
    dtsRollup: { enabled: true, publicTrimmedFilePath: rolled },
    tsdocMetadata: { enabled: false },
    messages: {
      compilerMessageReporting: { default: { logLevel: "none" } },
      extractorMessageReporting: { default: { logLevel: "none" } },
    },
  },
  configObjectFullPath: path.join(packageDir, "api-extractor.json"),
  packageJsonFullPath: path.join(packageDir, "package.json"),
});

const result = Extractor.invoke(config, {
  localBuild: false,
  showVerboseMessages: false,
  showDiagnostics: false,
});
if (!result.succeeded) {
  throw new Error(`API Extractor: ${result.errorCount} error(s)`);
}
const text = fs.readFileSync(rolled, "utf8");
if (/from ['"]react['"]/.test(text)) {
  throw new Error("dist/vue/index.d.ts imports from react");
}
fs.rmSync(typesDir, { recursive: true, force: true });
