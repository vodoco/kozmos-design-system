import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import {
  generatedJsonIsCurrent,
  writeGeneratedJson,
} from "./write-generated-json.mjs";

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const OUTPUT_PATH = path.join(ROOT_DIR, "docs/figma-library-manifest.json");
const INTERNAL_PROP_NAMES = new Set(["className", "key", "ref", "style"]);
const INTERNAL_COMPONENT_NAMES = new Set(["GlassSettingsPanel"]);

const PATHS = {
  tokensLight: "packages/tokens/src/tokens-light.json",
  tokensDark: "packages/tokens/src/tokens-dark.json",
  reactComponents: "packages/react/src/components",
  reactIndex: "packages/react/src/index.ts",
};

const LINKED_CONFIGS = {
  react: {
    config: "figma.linked.config.json",
    packageRoot: "packages/react",
    extension: ".figma.tsx",
  },
  ios: {
    config: "packages/ios/figma.linked.config.json",
    packageRoot: "packages/ios",
    extension: ".figma.swift",
  },
  android: {
    config: "packages/android/figma.linked.config.json",
    packageRoot: "packages/android",
    extension: ".figma.kt",
  },
};

const CODE_CONNECT_FILE_OVERRIDES = {
  FieldWrapper:
    "packages/react/src/components/FieldWrapper/FormField.figma.tsx",
};

function readJson(repoPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, repoPath), "utf-8"));
}

function exists(repoPath) {
  return fs.existsSync(path.join(ROOT_DIR, repoPath));
}

function read(repoPath) {
  return fs.readFileSync(path.join(ROOT_DIR, repoPath), "utf-8");
}

function repoRelative(absPath) {
  return path.relative(ROOT_DIR, absPath).replaceAll(path.sep, "/");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveConfigInclude(configRepoPath, packageRoot, includePath) {
  const configPath = path.join(ROOT_DIR, configRepoPath);
  const candidates = [
    path.resolve(path.dirname(configPath), includePath),
    path.join(ROOT_DIR, includePath),
    path.join(ROOT_DIR, packageRoot, includePath),
  ];

  return (
    candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0]
  );
}

function inspectLinkedConfig({ config, packageRoot, extension }) {
  if (!exists(config)) {
    return { config, files: [], placeholderFiles: [] };
  }

  const includes = readJson(config).codeConnect?.include || [];
  const files = includes
    .filter((includePath) => includePath.endsWith(extension))
    .map((includePath) =>
      repoRelative(resolveConfigInclude(config, packageRoot, includePath)),
    );
  const placeholderFiles = files.filter(
    (filePath) => exists(filePath) && /node-id=TBD/i.test(read(filePath)),
  );

  return { config, files, placeholderFiles };
}

function linkedStatus(label, configInfo) {
  if (configInfo.placeholderFiles.length === 0) {
    return `ready for the current ${configInfo.files.length} ${label} component-set mappings`;
  }

  return `blocked: ${configInfo.placeholderFiles.length} ${label} linked mapping(s) still contain node-id=TBD`;
}

function flattenTokens(source, mode, group = [], output = []) {
  for (const [key, value] of Object.entries(source)) {
    const nextGroup = [...group, key];

    if (
      value &&
      typeof value === "object" &&
      ("$value" in value || "value" in value)
    ) {
      output.push({
        name: nextGroup.join("/"),
        path: nextGroup,
        mode,
        type: value.$type || value.type || "unknown",
        value: value.$value ?? value.value,
        scopes: value.$extensions?.["com.figma.scopes"] || [],
      });
    } else if (value && typeof value === "object") {
      flattenTokens(value, mode, nextGroup, output);
    }
  }

  return output;
}

function recommendFigmaScope(token) {
  const lowerPath = token.name.toLowerCase();
  const type = token.type.toLowerCase();

  if (type === "color")
    return ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
  if (lowerPath.includes("radius")) return ["CORNER_RADIUS"];
  if (lowerPath.includes("spacing") || lowerPath.includes("gap"))
    return ["GAP"];
  if (lowerPath.includes("font-size")) return ["FONT_SIZE"];
  if (lowerPath.includes("line-height")) return ["LINE_HEIGHT"];
  if (lowerPath.includes("width") || lowerPath.includes("height"))
    return ["WIDTH_HEIGHT"];

  return [];
}

function inspectCodeConnectMapping(repoPath, componentName = null) {
  if (!exists(repoPath)) {
    return {
      file: null,
      linked: false,
      figmaUrl: null,
      needsNodeId: false,
      status: "missing",
      issues: [],
      connectedComponents: [],
      mappedProps: [],
    };
  }

  const content = read(repoPath);
  const placeholderChecks = [
    ["node-id=TBD", /node-id=TBD/i],
    ["replace-node-id TODO", /TODO:\s*Replace node-id/i],
    ["placeholder comment", /^\s*\/\/\s*Placeholder\b/im],
    ["placeholder button node constant", /BUTTON_NODE_ID/],
    ["placeholder file key", /FILE_KEY/],
    [
      "placeholder Figma URL",
      /https:\/\/(?:www\.)?figma\.com\/(?:file|design)\/XXXXX/i,
    ],
  ];
  const issues = placeholderChecks
    .filter(([, pattern]) => pattern.test(content))
    .map(([issue]) => issue);
  const hasConnectCall =
    /figma\.connect\(|@FigmaConnect|figmaNodeUrl|FigmaConnect\(/.test(content);

  if (!hasConnectCall) issues.push("missing Code Connect call");

  const figmaUrl = extractFigmaUrl(repoPath);
  const connectedComponents = extractConnectedComponentNames(
    repoPath,
    componentName,
  );

  return {
    file: repoPath,
    linked: hasConnectCall && issues.length === 0,
    figmaUrl,
    needsNodeId: Boolean(figmaUrl && /node-id=TBD/i.test(figmaUrl)),
    status: hasConnectCall && issues.length === 0 ? "linked" : "scaffold",
    issues,
    connectedComponents,
    mappedProps: extractCodeConnectProps(repoPath, connectedComponents),
  };
}

function extractFigmaUrl(repoPath) {
  if (!exists(repoPath)) return null;

  const content = read(repoPath);
  const match = content.match(/https:\/\/figma\.com\/design\/[^'")\s]+/);
  return match ? match[0] : null;
}

function createTsxSourceFile(repoPath) {
  return ts.createSourceFile(
    repoPath,
    read(repoPath),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

function extractConnectedComponentNames(repoPath, componentName = null) {
  if (!exists(repoPath)) return [];

  const sourceFile = createTsxSourceFile(repoPath);
  const connectedNames = new Set(componentName ? [componentName] : []);

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "connect"
    ) {
      const componentArg = node.arguments[0];
      if (ts.isIdentifier(componentArg)) {
        connectedNames.add(componentArg.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return [...connectedNames].sort((a, b) => a.localeCompare(b));
}

function jsxTagNameText(tagName) {
  if (ts.isIdentifier(tagName)) return tagName.text;
  if (ts.isPropertyAccessExpression(tagName)) return tagName.name.text;
  return null;
}

function extractCodeConnectProps(repoPath, connectedComponentNames = []) {
  if (!exists(repoPath)) return [];

  const sourceFile = createTsxSourceFile(repoPath);
  const connectedNames = new Set(connectedComponentNames);
  const props = new Set();

  function collectJsxAttributes(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = jsxTagNameText(node.tagName);
      if (tagName && connectedNames.has(tagName)) {
        for (const attr of node.attributes.properties) {
          if (ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name)) {
            const attrName = attr.name.text;
            if (shouldKeepPropName(attrName)) props.add(attrName);
          }
        }
      }
    }

    ts.forEachChild(node, collectJsxAttributes);
  }

  collectJsxAttributes(sourceFile);

  return [...props].sort((a, b) => a.localeCompare(b));
}

function propNameFromNode(nameNode, sourceFile) {
  if (!nameNode) return null;
  if (
    ts.isIdentifier(nameNode) ||
    ts.isStringLiteral(nameNode) ||
    ts.isNumericLiteral(nameNode)
  ) {
    return nameNode.text;
  }
  return nameNode.getText(sourceFile).replace(/^['"]|['"]$/g, "");
}

function shouldKeepPropName(name) {
  return (
    Boolean(name) && !INTERNAL_PROP_NAMES.has(name) && !/^on[A-Z]/.test(name)
  );
}

function addProp(props, name) {
  if (shouldKeepPropName(name)) props.add(name);
}

function collectCvaVariants(sourceFile) {
  const variantsByName = new Map();

  function readObjectPropertyNames(objectNode) {
    return objectNode.properties
      .map((property) => propNameFromNode(property.name, sourceFile))
      .filter(Boolean);
  }

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText(sourceFile) === "cva"
    ) {
      const config = node.initializer.arguments[1];
      if (config && ts.isObjectLiteralExpression(config)) {
        const variantsProperty = config.properties.find(
          (property) =>
            ts.isPropertyAssignment(property) &&
            propNameFromNode(property.name, sourceFile) === "variants" &&
            ts.isObjectLiteralExpression(property.initializer),
        );

        if (
          variantsProperty &&
          ts.isPropertyAssignment(variantsProperty) &&
          ts.isObjectLiteralExpression(variantsProperty.initializer)
        ) {
          const axes = {};
          for (const property of variantsProperty.initializer.properties) {
            if (
              ts.isPropertyAssignment(property) &&
              ts.isObjectLiteralExpression(property.initializer)
            ) {
              const axisName = propNameFromNode(property.name, sourceFile);
              if (axisName)
                axes[axisName] = readObjectPropertyNames(
                  property.initializer,
                ).sort((a, b) => a.localeCompare(b));
            }
          }
          variantsByName.set(node.name.text, axes);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return variantsByName;
}

function collectPropTypeDefinitions(sourceFile) {
  const definitions = new Map();

  ts.forEachChild(sourceFile, function visit(node) {
    if (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      node.name
    ) {
      definitions.set(node.name.text, node);
    }
    ts.forEachChild(node, visit);
  });

  return definitions;
}

function typeNameText(typeNode, sourceFile) {
  if (!typeNode || !typeNode.typeName) return "";
  return typeNode.typeName.getText(sourceFile);
}

function collectVariantProps(typeArgument, context, props) {
  if (!typeArgument || !ts.isTypeQueryNode(typeArgument)) return;

  const variantSource = context.cvaVariants.get(
    typeArgument.exprName.getText(context.sourceFile),
  );
  if (!variantSource) return;

  for (const [axisName, values] of Object.entries(variantSource)) {
    addProp(props, axisName);
    context.variants[axisName] = values;
  }
}

function addProps(props, names) {
  for (const name of names) addProp(props, name);
}

function collectKnownExternalProps(typeNode, context, props) {
  return collectKnownExternalPropsFromText(
    typeNode.getText(context.sourceFile),
    props,
  );
}

function collectKnownExternalPropsFromText(typeText, props) {
  if (!/(?:React\.)?ComponentProps(?:WithoutRef|WithRef)?</.test(typeText))
    return false;

  if (/CheckboxPrimitive\.Root|SwitchPrimitive\.Root/.test(typeText)) {
    addProps(props, [
      "checked",
      "children",
      "defaultChecked",
      "disabled",
      "id",
      "required",
      "value",
    ]);
    return true;
  }

  if (/AccordionPrimitive\.Root/.test(typeText)) {
    addProps(props, [
      "children",
      "collapsible",
      "defaultValue",
      "disabled",
      "type",
      "value",
    ]);
    return true;
  }

  if (/TabsPrimitive\.Root/.test(typeText)) {
    addProps(props, [
      "activationMode",
      "children",
      "defaultValue",
      "dir",
      "orientation",
      "value",
    ]);
    return true;
  }

  if (/SliderPrimitive\.Root/.test(typeText)) {
    addProps(props, [
      "children",
      "defaultValue",
      "disabled",
      "id",
      "inverted",
      "max",
      "min",
      "name",
      "orientation",
      "step",
      "value",
    ]);
    return true;
  }

  if (/ProgressPrimitive\.Root/.test(typeText)) {
    addProps(props, ["children", "max", "value"]);
    return true;
  }

  if (/SelectPrimitive\.Root/.test(typeText)) {
    addProps(props, [
      "children",
      "defaultOpen",
      "defaultValue",
      "disabled",
      "name",
      "open",
      "required",
      "value",
    ]);
    return true;
  }

  if (/SelectPrimitive\.Trigger/.test(typeText)) {
    addProps(props, ["autoFocus", "children", "disabled", "id"]);
    return true;
  }

  if (/DialogPrimitive\.Root/.test(typeText)) {
    addProps(props, ["children", "defaultOpen", "modal", "open"]);
    return true;
  }

  if (/DialogPrimitive\.Content/.test(typeText)) {
    addProps(props, ["children", "forceMount", "side"]);
    return true;
  }

  if (/PopoverPrimitive\.Content|TooltipPrimitive\.Content/.test(typeText)) {
    addProps(props, [
      "align",
      "children",
      "collisionPadding",
      "side",
      "sideOffset",
    ]);
    return true;
  }

  if (/RadioGroupPrimitive\.Root/.test(typeText)) {
    addProps(props, [
      "children",
      "defaultValue",
      "disabled",
      "name",
      "orientation",
      "required",
      "value",
    ]);
    return true;
  }

  if (/RadioGroupPrimitive\.Item/.test(typeText)) {
    addProps(props, [
      "checked",
      "children",
      "disabled",
      "id",
      "required",
      "value",
    ]);
    return true;
  }

  if (/ToastPrimitive\.Root/.test(typeText)) {
    addProps(props, [
      "children",
      "defaultOpen",
      "duration",
      "forceMount",
      "open",
      "type",
    ]);
    return true;
  }

  if (/TogglePrimitive\.Root/.test(typeText)) {
    addProps(props, ["children", "defaultPressed", "disabled", "pressed"]);
    return true;
  }

  return false;
}

function collectKnownImportedProps(localName, context, props) {
  if (localName === "BoxProps") {
    addProps(props, ["asChild", "children", "id"]);
    return true;
  }

  if (localName !== "ButtonProps") return false;

  addProps(props, [
    "aria-label",
    "asChild",
    "autoFocus",
    "children",
    "disabled",
    "isLoading",
    "size",
    "variant",
  ]);
  context.variants.size = ["default", "icon", "lg", "sm"];
  context.variants.variant = [
    "default",
    "destructive",
    "ghost",
    "glass",
    "link",
    "outline",
    "secondary",
  ];
  return true;
}

function collectPropsFromMembers(members, context, props) {
  for (const member of members) {
    if (
      (ts.isPropertySignature(member) || ts.isMethodSignature(member)) &&
      member.name
    ) {
      addProp(props, propNameFromNode(member.name, context.sourceFile));
    }
  }
}

function collectPropsFromHeritage(heritageClauses, context, props, seen) {
  if (!heritageClauses) return;

  for (const clause of heritageClauses) {
    for (const type of clause.types) {
      const expressionText = type.expression.getText(context.sourceFile);
      if (
        collectKnownExternalPropsFromText(
          type.getText(context.sourceFile),
          props,
        )
      ) {
        continue;
      }

      if (expressionText === "VariantProps") {
        collectVariantProps(type.typeArguments?.[0], context, props);
        continue;
      }

      const localName = expressionText.split(".").at(-1);
      if (context.definitions.has(localName)) {
        collectPropsFromDefinition(localName, context, props, seen);
        continue;
      }

      if (collectKnownImportedProps(localName, context, props)) {
        continue;
      }
    }
  }
}

function collectPropsFromTypeNode(typeNode, context, props, seen) {
  if (!typeNode) return;

  if (ts.isParenthesizedTypeNode(typeNode)) {
    collectPropsFromTypeNode(typeNode.type, context, props, seen);
    return;
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    collectPropsFromMembers(typeNode.members, context, props);
    return;
  }

  if (ts.isIntersectionTypeNode(typeNode) || ts.isUnionTypeNode(typeNode)) {
    for (const nestedType of typeNode.types) {
      collectPropsFromTypeNode(nestedType, context, props, seen);
    }
    return;
  }

  if (ts.isTypeReferenceNode(typeNode)) {
    const fullName = typeNameText(typeNode, context.sourceFile);
    const localName = fullName.split(".").at(-1);

    if (collectKnownExternalProps(typeNode, context, props)) {
      return;
    }

    if (localName === "VariantProps") {
      collectVariantProps(typeNode.typeArguments?.[0], context, props);
      return;
    }

    if (context.definitions.has(localName)) {
      collectPropsFromDefinition(localName, context, props, seen);
      return;
    }

    if (collectKnownImportedProps(localName, context, props)) {
      return;
    }
  }
}

function collectPropsFromDefinition(
  definitionName,
  context,
  props,
  seen = new Set(),
) {
  if (seen.has(definitionName)) return;
  seen.add(definitionName);

  const definition = context.definitions.get(definitionName);
  if (!definition) return;

  if (ts.isInterfaceDeclaration(definition)) {
    collectPropsFromMembers(definition.members, context, props);
    collectPropsFromHeritage(definition.heritageClauses, context, props, seen);
    return;
  }

  if (ts.isTypeAliasDeclaration(definition)) {
    collectPropsFromTypeNode(definition.type, context, props, seen);
  }
}

function collectPropsFromFunctionLike(functionNode, context, props) {
  const firstParam = functionNode.parameters?.[0];
  if (!firstParam || !ts.isObjectBindingPattern(firstParam.name)) return;

  let restName = null;
  for (const element of firstParam.name.elements) {
    if (element.dotDotDotToken && ts.isIdentifier(element.name)) {
      restName = element.name.text;
      continue;
    }

    if (ts.isIdentifier(element.name)) {
      addProp(props, element.name.text);
    }
  }

  if (!restName || !functionNode.body) return;

  function visit(node) {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === restName
    ) {
      addProp(props, node.name.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(functionNode.body);
}

function collectPropsFromComponentDeclaration(
  sourceFile,
  componentName,
  context,
  props,
) {
  ts.forEachChild(sourceFile, function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === componentName
    ) {
      if (node.type && ts.isTypeReferenceNode(node.type)) {
        collectPropsFromTypeNode(
          node.type.typeArguments?.[0],
          context,
          props,
          new Set(),
        );
      }

      if (node.initializer && ts.isCallExpression(node.initializer)) {
        const callName = node.initializer.expression.getText(sourceFile);
        if (callName === "React.forwardRef" || callName === "forwardRef") {
          collectPropsFromTypeNode(
            node.initializer.typeArguments?.[1],
            context,
            props,
            new Set(),
          );
          const renderFunction = node.initializer.arguments[0];
          if (
            renderFunction &&
            (ts.isArrowFunction(renderFunction) ||
              ts.isFunctionExpression(renderFunction))
          ) {
            collectPropsFromFunctionLike(renderFunction, context, props);
          }
        }
      } else if (
        node.initializer &&
        (ts.isArrowFunction(node.initializer) ||
          ts.isFunctionExpression(node.initializer))
      ) {
        collectPropsFromFunctionLike(node.initializer, context, props);
      }
    }

    ts.forEachChild(node, visit);
  });
}

function addCommonInheritedProps(sourceFile, props) {
  const sourceText = sourceFile.getFullText();

  if (
    /React\.(?:ButtonHTMLAttributes|InputHTMLAttributes|TextareaHTMLAttributes|AnchorHTMLAttributes|HTMLAttributes|ComponentProps)|ComponentPropsWithoutRef/.test(
      sourceText,
    )
  ) {
    addProps(props, [
      "aria-describedby",
      "aria-invalid",
      "aria-label",
      "children",
      "id",
      "role",
      "tabIndex",
      "title",
    ]);
  }

  if (/ButtonHTMLAttributes/.test(sourceText)) {
    addProps(props, ["autoFocus", "disabled", "type"]);
  }

  if (/(?:InputHTMLAttributes|TextareaHTMLAttributes)/.test(sourceText)) {
    for (const propName of [
      "autoFocus",
      "defaultValue",
      "disabled",
      "name",
      "placeholder",
      "readOnly",
      "required",
      "value",
    ]) {
      addProp(props, propName);
    }
  }

  if (/AnchorHTMLAttributes/.test(sourceText)) {
    addProp(props, "href");
  }
}

function extractProps(repoPath, componentName) {
  if (!exists(repoPath)) return { props: [], variants: {} };

  const content = read(repoPath);
  const sourceFile = ts.createSourceFile(
    repoPath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const context = {
    sourceFile,
    definitions: collectPropTypeDefinitions(sourceFile),
    cvaVariants: collectCvaVariants(sourceFile),
    variants: {},
  };
  const propNames = new Set();

  collectPropsFromDefinition(`${componentName}Props`, context, propNames);
  collectPropsFromComponentDeclaration(
    sourceFile,
    componentName,
    context,
    propNames,
  );
  addCommonInheritedProps(sourceFile, propNames);

  return {
    props: [...propNames].sort((a, b) => a.localeCompare(b)),
    variants: Object.fromEntries(
      Object.entries(context.variants).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

function resolveComponentPropSource(componentFile, componentName) {
  if (!exists(componentFile)) return componentFile;

  const content = read(componentFile);
  const exportMatch = content.match(
    new RegExp(
      `export\\s*\\{[\\s\\S]*?\\b${escapeRegExp(componentName)}\\b[\\s\\S]*?\\}\\s*from\\s*["']([^"']+)["']`,
    ),
  );
  if (!exportMatch) return componentFile;

  const componentDir = path.dirname(path.join(ROOT_DIR, componentFile));
  const base = path.resolve(componentDir, exportMatch[1]);
  const candidates = [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, "index.tsx"),
  ];
  const resolved = candidates.find((candidate) => fs.existsSync(candidate));

  return resolved ? repoRelative(resolved) : componentFile;
}

function mergeComponentApis(apis) {
  const props = uniqueValues(apis.flatMap((api) => api.props));
  const variants = {};

  for (const api of apis) {
    Object.assign(variants, api.variants);
  }

  return { props, variants };
}

function discoverReactComponents() {
  const componentRoot = path.join(ROOT_DIR, PATHS.reactComponents);
  const exportedIndex = exists(PATHS.reactIndex) ? read(PATHS.reactIndex) : "";

  return fs
    .readdirSync(componentRoot)
    .filter((name) => fs.statSync(path.join(componentRoot, name)).isDirectory())
    .filter((name) => !INTERNAL_COMPONENT_NAMES.has(name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const base = `packages/react/src/components/${name}`;
      const componentFile = `${base}/${name}.tsx`;
      const storyFile = `${base}/${name}.stories.tsx`;
      const testFile = `${base}/${name}.test.tsx`;
      const codeConnectFile =
        CODE_CONNECT_FILE_OVERRIDES[name] ?? `${base}/${name}.figma.tsx`;
      const codeConnect = inspectCodeConnectMapping(codeConnectFile, name);
      const componentPropSource = resolveComponentPropSource(
        componentFile,
        name,
      );
      const componentApi = mergeComponentApis(
        uniqueValues([name, ...codeConnect.connectedComponents]).map(
          (connectedName) => extractProps(componentPropSource, connectedName),
        ),
      );
      const unmappedProps = codeConnect.mappedProps.filter(
        (propName) => !componentApi.props.includes(propName),
      );

      return {
        name,
        source: componentFile,
        story: exists(storyFile) ? storyFile : null,
        test: exists(testFile) ? testFile : null,
        exported: exportedIndex.includes(`./components/${name}`),
        codeConnect: {
          ...codeConnect,
          unmappedProps,
        },
        props: componentApi.props,
        variants: componentApi.variants,
      };
    });
}

function summarizeComponents(components) {
  return {
    total: components.length,
    stories: components.filter((component) => component.story).length,
    tests: components.filter((component) => component.test).length,
    exported: components.filter((component) => component.exported).length,
    codeConnectFiles: components.filter(
      (component) => component.codeConnect.file,
    ).length,
    codeConnectScaffolds: components.filter(
      (component) => component.codeConnect.status === "scaffold",
    ).length,
    codeConnectLinked: components.filter(
      (component) => component.codeConnect.linked,
    ).length,
  };
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function buildManifest() {
  const lightTokens = flattenTokens(readJson(PATHS.tokensLight), "light");
  const darkTokens = flattenTokens(readJson(PATHS.tokensDark), "dark");
  const components = discoverReactComponents();
  const componentSummary = summarizeComponents(components);
  const linkedReact = inspectLinkedConfig(LINKED_CONFIGS.react);
  const linkedIos = inspectLinkedConfig(LINKED_CONFIGS.ios);
  const linkedAndroid = inspectLinkedConfig(LINKED_CONFIGS.android);
  const firstBatch = components
    .filter((component) => component.codeConnect.file)
    .map((component) => component.name);

  return {
    schemaVersion: 1,
    sourceOfTruth: {
      tokens: [PATHS.tokensLight, PATHS.tokensDark],
      reactComponents: PATHS.reactComponents,
      reactIndex: PATHS.reactIndex,
    },
    figma: {
      knownFileKeys: uniqueValues(
        components
          .map((component) => component.codeConnect.figmaUrl)
          .map((url) => url?.match(/figma\.com\/design\/([^/?#]+)/)?.[1]),
      ),
      publishCommand: "pnpm figma:publish:dry",
      publishStatus:
        componentSummary.codeConnectScaffolds > 0
          ? "blocked for all-component React publish until non-core node-id=TBD scaffolds are linked; use linked publish for Core"
          : "ready",
      linkedPublishCommand: "pnpm figma:publish:linked:dry",
      linkedPublishConfig: linkedReact.config,
      linkedPublishStatus: linkedStatus("Core React", linkedReact),
      nativeLinkedPublishCommand: "pnpm figma:publish:native:linked:dry",
      nativeLinkedPublishConfigs: [linkedIos.config, linkedAndroid.config],
      nativeLinkedPublishStatus:
        linkedIos.placeholderFiles.length === 0 &&
        linkedAndroid.placeholderFiles.length === 0
          ? `ready for the current ${linkedIos.files.length} Core SwiftUI and ${linkedAndroid.files.length} Core Compose component-set mappings`
          : [
              linkedStatus("Core SwiftUI", linkedIos),
              linkedStatus("Core Compose", linkedAndroid),
            ].join("; "),
    },
    tokens: {
      summary: {
        light: lightTokens.length,
        dark: darkTokens.length,
      },
      light: lightTokens.map((token) => ({
        name: token.name,
        type: token.type,
        value: token.value,
        scopes: token.scopes,
        recommendedFigmaScopes: recommendFigmaScope(token),
      })),
      dark: darkTokens.map((token) => ({
        name: token.name,
        type: token.type,
        value: token.value,
        scopes: token.scopes,
        recommendedFigmaScopes: recommendFigmaScope(token),
      })),
    },
    components: {
      summary: componentSummary,
      firstBatch,
      items: components,
    },
    recommendedPhases: [
      "Create variables and styles from tokens",
      "Create library pages and documentation frames",
      "Build first-batch React components with real Figma node IDs",
      "Replace node-id=TBD in existing Code Connect files",
      "Publish Code Connect dry-run, then publish",
      "Generate native Code Connect mappings after React/Figma API stabilizes",
    ],
  };
}

const manifest = buildManifest();
// CI runs --check: the manifest went without #211's two Map marker tokens
// until #217 regenerated it, because nothing compared it with its sources.
if (process.argv.includes("--check")) {
  if (!generatedJsonIsCurrent(OUTPUT_PATH, manifest)) {
    console.error(
      `${path.relative(ROOT_DIR, OUTPUT_PATH)} is stale: run \`pnpm figma:manifest\` and commit the result.`,
    );
    process.exit(1);
  }
  console.log(`${path.relative(ROOT_DIR, OUTPUT_PATH)} is current`);
} else {
  await writeGeneratedJson(OUTPUT_PATH, manifest);
  console.log(`Wrote ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
}
