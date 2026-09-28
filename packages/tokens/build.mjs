import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";
import fs from "fs";
import path from "path";

register(StyleDictionary);

console.log("🏗️  Starting Style Dictionary Build (v5)...");

const pointrPaletteDir = process.env.POINTR_COLOR_PALETTE_DIR;

function optionalPointrPlatform(destination) {
  if (!pointrPaletteDir) return {};

  const buildPath = pointrPaletteDir.endsWith(path.sep)
    ? pointrPaletteDir
    : `${pointrPaletteDir}${path.sep}`;

  return {
    pointr: {
      transformGroup: "css",
      buildPath,
      files: [
        {
          destination,
          format: "pointr/color-palette",
        },
      ],
    },
  };
}

function resolveDarkAlias(root, value, depth = 0) {
  const match = /^\{(.+)\}$/.exec(String(value).trim());
  if (!match || depth > 10) return value;
  const target = match[1]
    .split(".")
    .reduce(
      (node, key) => (node && node[key] !== undefined ? node[key] : undefined),
      root,
    );
  if (!target) return value;
  return resolveDarkAlias(root, target.value || target.$value, depth + 1);
}

// Helper to merge Dark tokens into Light tokens as 'darkValue'
function mergeDarkTokens(light, dark, darkRoot = dark) {
  for (const key in light) {
    if (dark && dark[key]) {
      if (
        Object.prototype.hasOwnProperty.call(light[key], "value") ||
        Object.prototype.hasOwnProperty.call(light[key], "$value")
      ) {
        // A dark value written as an alias ("{Primitives.Colors.background.200}")
        // must be resolved against the dark tree, or the alias string itself
        // reaches the generated Swift as a hex — which is what happened to the
        // first semantic colour alias, Semantics.Border, on 2026-09-03.
        const darkVal = resolveDarkAlias(
          darkRoot,
          dark[key].value || dark[key].$value,
        );
        if (darkVal) {
          if (!light[key].attributes) light[key].attributes = {};
          light[key].attributes.darkValue = darkVal;
        }
      } else if (typeof light[key] === "object") {
        // It's a group, recurse
        mergeDarkTokens(light[key], dark[key], darkRoot);
      }
    }
  }
  return light;
}

// Helper for camelCase
function toCamelCase(path) {
  let result = path
    .join(" ")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) => {
      if (index === 0) return part.toLowerCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");

  // Prevent invalid identifiers in Swift/Kotlin
  if (/^[0-9]/.test(result)) {
    result = "_" + result;
  }
  return result;
}

StyleDictionary.registerTransform({
  name: "name/kozmos/camel",
  type: "name",
  transform: (token) => toCamelCase(token.path || [token.name]),
});

// Fix for Android AAPT not allowing floats in <integer>
function fixAndroidXML(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    // Replace <integer> with float value to <item type="dimen" format="float">
    content = content.replace(
      /<integer name="([^"]+)">([-0-9]+\.[0-9]+)<\/integer>/g,
      '<item name="$1" type="dimen" format="float">$2</item>',
    );

    // Convert rem to dp (1rem = 16dp) and string to dimen
    content = content.replace(
      /<string name="([^"]+)">([-0-9.]+)rem<\/string>/g,
      (match, name, val) => {
        return `<dimen name="${name}">${parseFloat(val) * 16}dp</dimen>`;
      },
    );

    // Convert px string to dimen
    content = content.replace(
      /<string name="([^"]+)">([-0-9.]+)px<\/string>/g,
      '<dimen name="$1">$2px</dimen>',
    );

    // Ensure all names are valid for AAPT (no hyphens, no periods)
    content = content.replace(/name="([^"]+)"/g, (match, name) => {
      let sanitized = name.replace(/[-.\s]/g, "_");
      if (/^[0-9]/.test(sanitized)) sanitized = "_" + sanitized;
      return `name="${sanitized}"`;
    });

    fs.writeFileSync(filePath, content);
  }
}

// Custom Format for iOS Dynamic Colors
// A colour token's value as Android and the Swift palette both read it: eight
// hex digits, alpha first. Token values are CSS — #RGB, #RRGGBB, #RRGGBBAA
// with the alpha last, or rgb()/rgba() — and a value that is none of these
// throws. Until 2026-09-22 the Swift palette passed CSS strings straight to its
// parser, which reads eight digits alpha first and cannot read rgba() at all:
// the scrim drew nothing and the transparent ramps drew faint blues.
function cssColorToArgb(value, where) {
  const text = String(value).trim();
  const compose = text.match(/^Color\(0x([0-9a-fA-F]{8})\)$/);
  if (compose) return compose[1].toLowerCase();
  const rgba = text.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (rgba) {
    const [r, g, b] = [rgba[1], rgba[2], rgba[3]].map((c) =>
      parseInt(c, 10).toString(16).padStart(2, "0"),
    );
    const a =
      rgba[4] === undefined
        ? "ff"
        : Math.round(parseFloat(rgba[4]) * 255)
            .toString(16)
            .padStart(2, "0");
    return a + r + g + b;
  }
  const hex = text.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (!hex) throw new Error(`${where}: ${text} is not a colour the build can write`);
  let digits = hex[1].toLowerCase();
  if (digits.length === 3)
    digits = digits
      .split("")
      .map((c) => c + c)
      .join("");
  if (digits.length === 6) return "ff" + digits;
  return digits.slice(6, 8) + digits.slice(0, 6);
}

// The Swift palette's parser reads #RGB, #RRGGBB and #AARRGGBB. A six-digit
// value is written as the token has it; anything else goes through
// cssColorToArgb, alpha first.
function swiftColorHex(value, where) {
  const text = String(value).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(text)) return text;
  return "#" + cssColorToArgb(text, where).toUpperCase();
}

StyleDictionary.registerFormat({
  name: "ios-swift/dynamic",
  format: ({ dictionary }) => {
    return `import SwiftUI

#if canImport(UIKit)
import UIKit

// Extension to create Color from Hex safely natively
extension UIColor {
    convenience init(hex: String?) {
        guard let hex = hex else {
            self.init(white: 0, alpha: 0)
            return
        }
        let hexString = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hexString.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit): alpha first, as the token build writes it
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(red: CGFloat(r) / 255, green: CGFloat(g) / 255, blue: CGFloat(b) / 255, alpha: CGFloat(a) / 255)
    }
}
#elseif canImport(AppKit)
import AppKit

extension NSColor {
    convenience init(hex: String?) {
        guard let hex = hex else {
            self.init(white: 0, alpha: 0)
            return
        }
        let hexString = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hexString.count {
        case 3: 
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: 
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: 
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(red: CGFloat(r) / 255, green: CGFloat(g) / 255, blue: CGFloat(b) / 255, alpha: CGFloat(a) / 255)
    }
}
#endif

public class KozmosColors {
${dictionary.allTokens
  .filter((token) => {
    const isColor =
      (token.attributes && token.attributes.category === "color") ||
      token.type === "color" ||
      token.$type === "color" ||
      token.path[0] === "color" ||
      token.name.toLowerCase().includes("color");
    return isColor;
  })
  .map((token) => {
    // Try all possible value locations (StyleDictionary puts custom properties in token.original)
    const varName = toCamelCase(token.path);
    const lightVal = swiftColorHex(firstDefinedTokenValue(token), varName);
    const darkVal = swiftColorHex(
      (token.attributes && token.attributes.darkValue) ||
        firstDefinedTokenValue(token),
      varName,
    );

    return `    public static var ${varName}: Color {
        #if canImport(UIKit)
        return Color(UIColor { traitCollection in
            return traitCollection.userInterfaceStyle == .dark ? UIColor(hex: "${darkVal}") : UIColor(hex: "${lightVal}")
        })
        #elseif canImport(AppKit)
        return Color(NSColor(name: nil, dynamicProvider: { appearance in
            return appearance.name == .darkAqua ? NSColor(hex: "${darkVal}") : NSColor(hex: "${lightVal}")
        }))
        #else
        return Color.clear
        #endif
    }`;
  })
  .join("\n")}
}`;
  },
});

// A token whose value is 0 is a real value, not a missing one. The old
// `token.value || token.$value || ...` chain treated it as absent and fell
// through to the unresolved alias string, so a zero-valued dimension that
// arrived by reference was dropped from the native outputs entirely.
// parseFloat("1rem") is 1, so a rem-valued dimension reached the native
// outputs as one point instead of sixteen: primitivesRadiusCard, Input and
// Button all emitted `1`. Nothing used them, which is the only reason it never
// showed up as a hairline corner on a card.
function toNumericPx(value) {
  if (typeof value === "string" && value.trim().endsWith("rem")) {
    const rem = Number.parseFloat(value);
    return Number.isNaN(rem) ? Number.NaN : rem * 16;
  }
  return Number.parseFloat(value);
}

// Style Dictionary's `size/remToDp` and `size/compose/remToDp` multiply every
// dimension-typed value by 16 without reading its unit, on the assumption that
// a dimension is written in rem. Ours are not all rem: the screen breakpoints
// and the icon stroke widths are px, so Android received 6000dp for a 375px
// breakpoint and 24dp for a 1.5px stroke while the CSS, JS and Swift outputs
// carried the real numbers. These read the unit — rem is sixteen dp, px and a
// bare number are one — and stand in for the built-in transforms in the
// Android platforms below. Only a literal reaches a value transform; an alias
// is resolved afterwards and the formats read it through toNumericPx.
function isDimensionToken(token) {
  return (token.$type || token.type) === "dimension";
}

function dimensionToDp(token, transformName) {
  const value = token.$value !== undefined ? token.$value : token.value;
  const dp = toNumericPx(value);
  if (Number.isNaN(dp)) {
    throw new Error(
      `${transformName}: "${value}" (${token.name}) is not a length`,
    );
  }
  return dp.toFixed(2);
}

StyleDictionary.registerTransform({
  name: "size/kozmos/dp",
  type: "value",
  filter: isDimensionToken,
  transform: (token) => `${dimensionToDp(token, "size/kozmos/dp")}dp`,
});

StyleDictionary.registerTransform({
  name: "size/kozmos/composeDp",
  type: "value",
  filter: isDimensionToken,
  transform: (token) => `${dimensionToDp(token, "size/kozmos/composeDp")}.dp`,
});

function firstDefinedTokenValue(token) {
  const candidates = [
    token.value,
    token.$value,
    token.original && token.original.value,
    token.original && token.original.$value,
  ];
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) return candidate;
  }
  return undefined;
}

/**
 * A pill is a shape, not a length.
 *
 * `Semantics.Radius.Pill` is the sentinel 9999 — CSS idiom for "as round as this
 * box allows", and meaningless as a native dimension. Emitted as a number it is
 * a loaded gun: `semanticsRadiusPill: CGFloat = 9999` reads like a value and
 * gives 9999pt to anyone who applies it. Worse, it cannot be reasoned about —
 * a ring 4px outside a pill wants `9999 + 4`, which is the answer to nothing.
 *
 * Every component already does the right thing without it: SwiftUI `Capsule()`,
 * Compose `RoundedCornerShape(percent = 50)`. So the constant is skipped rather
 * than exported, and the generated file says so where it would have been.
 */
const PILL_SENTINEL = 9999;
// Keyed on the path as well as the value. Keying on the number alone once ate
// the screen breakpoints, which arrived here at 16x their real size — 768 came
// out as 12288 — so they cleared 9999 without being sentinels at all. The
// inflation is fixed (size/kozmos/dp above); the path check stays because a
// breakpoint is not a radius, whatever its size.
const isPillSentinel = (token, value) =>
  Number(value) >= PILL_SENTINEL &&
  token.path.some((part) => String(part).toLowerCase().includes("radius"));

StyleDictionary.registerFormat({
  name: "android-compose/dimensions",
  format: ({ dictionary, options }) => {
    const className = options.className || "KozmosDimensions";
    return `// Do not edit directly, this file was auto-generated.
package com.kozmos.tokens

import androidx.compose.ui.unit.dp

object ${className} {
${dictionary.allTokens
  .filter((token) => {
    return (
      (token.attributes && token.attributes.category === "dimension") ||
      token.type === "dimension" ||
      token.$type === "dimension" ||
      token.path.includes("radius") ||
      token.path.includes("spacing") ||
      token.path.includes("dimension") ||
      token.path.includes("Layout") ||
      token.path.includes("Width")
    );
  })
  .map((token) => {
    const lightVal = firstDefinedTokenValue(token);
    const varName = toCamelCase(token.path);

    let val = toNumericPx(lightVal);
    if (isNaN(val)) return "";
    if (isPillSentinel(token, val)) {
      return (
        "  // " +
        varName +
        " is not emitted: a pill is a shape, not a length." +
        " Use RoundedCornerShape(percent = 50)."
      );
    }

    return "  val " + varName + " = " + val + ".dp";
  })
  .filter(Boolean)
  .join("\n")}
}`;
  },
});

StyleDictionary.registerFormat({
  name: "ios-swift/dimensions",
  format: ({ dictionary, options }) => {
    const className = options.className || "KozmosDimensions";
    return `import Foundation
import CoreGraphics

public struct ${className} {
${dictionary.allTokens
  .filter((token) => {
    return (
      (token.attributes && token.attributes.category === "dimension") ||
      token.type === "dimension" ||
      token.$type === "dimension" ||
      token.path.includes("radius") ||
      token.path.includes("spacing") ||
      token.path.includes("dimension") ||
      token.path.includes("Layout") ||
      token.path.includes("Width")
    );
  })
  .map((token) => {
    const lightVal = firstDefinedTokenValue(token);
    const varName = toCamelCase(token.path);

    let val = toNumericPx(lightVal);
    if (isNaN(val)) return "";
    if (isPillSentinel(token, val)) {
      return (
        "    // " +
        varName +
        " is not emitted: a pill is a shape, not a" +
        " length. Use Capsule()."
      );
    }

    return "    public static let " + varName + ": CGFloat = " + val;
  })
  .filter(Boolean)
  .join("\n")}
}`;
  },
});

// The colours a Compose palette carries. Both palettes and the themed accessor
// select through this and name through `toCamelCase`, so every name the
// accessor wraps is one the palettes declare.
function isComposeColorToken(token) {
  return (
    (token.attributes && token.attributes.category === "color") ||
    token.type === "color" ||
    token.$type === "color" ||
    token.path[0] === "color" ||
    (token.name && token.name.toLowerCase().includes("color")) ||
    token.path.includes("Colors") ||
    token.path.includes("colors")
  );
}

StyleDictionary.registerFormat({
  name: "android-compose/exact",
  format: ({ dictionary, options }) => {
    const className = options.className || "KozmosColors";
    return `// Do not edit directly, this file was auto-generated.
package com.kozmos.tokens

import androidx.compose.ui.graphics.Color

object ${className} {
${dictionary.allTokens
  .filter(isComposeColorToken)
  .map((token) => {
    const lightVal = firstDefinedTokenValue(token);
    const varName = toCamelCase(token.path);
    return `  val ${varName} = Color(0x${cssColorToArgb(lightVal, varName)})`;
  })
  .join("\n")}
}`;
  },
});

// A token description is prose, and a doc comment ends at the first `*/` and
// nests at every `/*`. Neither belongs in prose, so both are broken apart.
function kdocSafe(text) {
  return String(text).replace(/\*\//g, "* /").replace(/\/\*/g, "/ *");
}

// Every colour, read for the theme the composition is in. `KozmosColors` and
// `KozmosColorsDark` hold one theme each, and a composable that reads either is
// pinned to it whatever the device shows. Until 2026-09-22 this object was
// written by hand and wrapped 82 of the 453 colours, so the components reached
// past it for the rest and drew light in dark mode. It is generated now, over
// the palettes' own selection and names, with each token's description as its
// doc comment, so the token sync copies it over the package like the palettes.
const COMPOSE_THEMED_DOC =
  "Every colour in the palette, read for the theme the composition is in: the palette a composable draws with. `KozmosColors` and `KozmosColorsDark` hold one theme each, and a component that reads either stays in that theme whatever the device shows. `pnpm tokens:theme:check` holds the components to this object.";

const COMPOSE_IS_DARK_DOC =
  "Whether the composition reads the dark palette: `LocalKozmosUseDarkTokens` when a provider sets it, the system's theme otherwise. Every accessor below decides by it. Read it only for what one colour cannot carry, such as a wash that is black at 5 % on light and white at 10 % on dark, as React's `bg-black/5 dark:bg-white/10` is.";

const COMPOSE_DARK_LOCAL_DOC =
  "Which palette `KozmosThemeTokens` reads: true for dark, false for light, null to follow the system. `KozmosThemeProvider` provides it from its theme mode.";

StyleDictionary.registerFormat({
  name: "android-compose/themed",
  format: ({ dictionary }) => {
    const doc = (text, indent) =>
      [
        `${indent}/**`,
        ...wrapWords(kdocSafe(text), 76 - indent.length).map(
          (line) => `${indent} * ${line}`,
        ),
        `${indent} */`,
      ].join("\n");
    const accessors = dictionary.allTokens
      .filter(isComposeColorToken)
      .map((token) => {
        const name = toCamelCase(token.path);
        const description =
          token.$description || token.description || token.comment;
        return [
          ...(description ? [doc(description, "    ")] : []),
          `    val ${name}: Color`,
          `        @Composable @ReadOnlyComposable get() = themed(`,
          `            KozmosColors.${name},`,
          `            KozmosColorsDark.${name}`,
          `        )`,
        ].join("\n");
      });
    return `// Do not edit directly, this file was auto-generated.
package com.kozmos.tokens

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color

${doc(COMPOSE_DARK_LOCAL_DOC, "")}
val LocalKozmosUseDarkTokens = compositionLocalOf<Boolean?> { null }

${doc(COMPOSE_THEMED_DOC, "")}
object KozmosThemeTokens {
${doc(COMPOSE_IS_DARK_DOC, "    ")}
    val isDark: Boolean
        @Composable @ReadOnlyComposable get() =
            LocalKozmosUseDarkTokens.current ?: isSystemInDarkTheme()

    @Composable
    @ReadOnlyComposable
    private fun themed(light: Color, dark: Color): Color = if (isDark) dark else light

${accessors.join("\n\n")}
}
`;
  },
});

// The native shadow files carry the elevation roles and only the roles. The
// `shadow.sm` / `md` / `lg` primitives they alias are not emitted: a component
// reaching past a role for a primitive is how the native platforms drifted to
// fifteen distinct shadows before the roles existed, and
// `pnpm tokens:elevation:check` counts what is left. Everything the packages
// carry — the doc comments, `none`, the SwiftUI modifier — is generated here,
// so the token sync can copy these files over the packages without losing any
// of it. Until 2026-09-13 the packages held a hand-enriched copy that the sync
// would have flattened.
const ELEVATION_ROLE_DOC = {
  Raised:
    "A surface lifted just off the page: cards, list rows. Barely there on purpose — the surface and its border do the work.",
  Floating:
    "A control floating over content it does not belong to: map chrome, a search bar over a map, a content card presented on top of the map, a status message.",
  Overlay:
    "Above everything, with what is behind it dimmed or ignored: dialogs, drawers, tooltips, popovers, detail panels, and the map panels that take focus.",
  "Map Control":
    "A control over a map: zoom, compass, the location and step-free control, the floor tile. The SDK's own map controls cast it (decision 40): three layers, the key light first.",
};

function isElevationRole(token) {
  const isShadow =
    token.type === "shadow" ||
    token.$type === "shadow" ||
    (token.attributes && token.attributes.category === "shadow");
  return isShadow && token.path.includes("Elevation");
}

// "{shadow.sm}" → "shadow.sm": what a role aliases, for the file header.
function aliasOf(token) {
  const original =
    token.original &&
    (token.original.$value !== undefined
      ? token.original.$value
      : token.original.value);
  const match = String(original === undefined ? "" : original)
    .trim()
    .match(/^\{(.+)\}$/);
  return match ? match[1] : null;
}

// Word-wrap prose for a comment block.
function wrapWords(text, width) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// A shadow is a colour and a geometry, and only the colour follows the theme —
// dark mode deepens the alpha so a surface still reads as lifted against a dark
// page. So the geometry must agree between modes, and a token where it does not
// is refused rather than quietly resolved to the light one. An unparseable
// value throws for the same reason: this formatter once fell back to a default
// and shipped one shadow under three names.
function parseShadow(value, where) {
  const rgba = String(value).match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/,
  );
  const dims = String(value)
    .replace(/rgba?\([^)]*\)/, "")
    .match(/-?[\d.]+/g);
  if (!rgba || !dims || dims.length < 3) {
    throw new Error(`shadows: cannot parse ${where} value "${value}"`);
  }
  return {
    r: parseInt(rgba[1], 10) / 255,
    g: parseInt(rgba[2], 10) / 255,
    b: parseInt(rgba[3], 10) / 255,
    a: parseFloat(rgba[4] === undefined ? "1" : rgba[4]),
    x: parseFloat(dims[0]),
    y: parseFloat(dims[1]),
    blur: parseFloat(dims[2]),
  };
}

// A shadow can be several, as CSS lists them: "0 8px 8px rgba(…), 0 0 32px
// rgba(…)". The map controls' role is three (decision 40). Split on the commas
// between layers, not the ones inside a colour.
function parseShadowLayers(value, where) {
  const layers = String(value)
    .split(/,(?![^(]*\))/)
    .map((layer) => layer.trim())
    .filter(Boolean);
  return layers.map((layer, index) =>
    parseShadow(
      layer,
      layers.length > 1 ? `${where} layer ${index + 1}` : where,
    ),
  );
}

function elevationRoles(dictionary) {
  return dictionary.allTokens.filter(isElevationRole).map((token) => {
    const name = toCamelCase(token.path);
    const role = token.path[token.path.length - 1];
    const lightValue = token.value || token.$value;
    const darkValue =
      (token.attributes && token.attributes.darkValue) || lightValue;
    const lightLayers = parseShadowLayers(lightValue, `${name} light`);
    const darkLayers = parseShadowLayers(darkValue, `${name} dark`);
    if (
      lightLayers.length !== darkLayers.length ||
      lightLayers.some(
        (light, i) =>
          light.x !== darkLayers[i].x ||
          light.y !== darkLayers[i].y ||
          light.blur !== darkLayers[i].blur,
      )
    ) {
      throw new Error(
        `shadows: ${name} changes geometry between modes (${lightValue} / ${darkValue}); a role holds one geometry`,
      );
    }
    return {
      name,
      role,
      alias: aliasOf(token),
      doc: ELEVATION_ROLE_DOC[role] || `The ${role} elevation role.`,
      // The key light: a single-layer role's only layer, a layered role's first.
      light: lightLayers[0],
      dark: darkLayers[0],
      lightLayers,
      darkLayers,
    };
  });
}

function aliasList(roles) {
  return roles
    .map((r) => r.alias)
    .filter(Boolean)
    .map((a) => `\`${a}\``)
    .join(" / ");
}

StyleDictionary.registerFormat({
  name: "android-compose/shadows",
  format: ({ dictionary, options }) => {
    const className = options.className || "KozmosShadows";
    const roles = elevationRoles(dictionary);
    const aliases = aliasList(roles);
    const blurs = roles.map((r) => r.light.blur).join(" / ");
    const layered = roles.filter((r) => r.lightLayers.length > 1);
    const header = [
      ...wrapWords(
        `The ${roles.length === 3 ? "three " : ""}elevation roles, mirroring \`Semantics.Elevation\` in \`packages/tokens\`${aliases ? ` — which aliases ${aliases} — ` : " "}and which \`pnpm tokens:elevation:check\` holds to these values.`,
        76,
      ),
      "",
      ...wrapWords(
        `Compose models a shadow as a single elevation in dp rather than as an offset, blur and alpha, so these carry the blur radius of each role: ${blurs}.`,
        76,
      ),
      ...(layered.length
        ? [
            "",
            ...wrapWords(
              `A role of several layers carries its key light's, the first: ${layered
                .map(
                  (r) =>
                    `${r.role} is ${r.lightLayers.map((l) => l.blur).join(" / ")} and carries ${r.light.blur}`,
                )
                .join("; ")}. Compose here has no layered shadow (Modifier.dropShadow arrived in Compose 1.9); Material's ambient light draws the soft wide part.`,
              76,
            ),
          ]
        : []),
    ];
    const members = roles.map((r) => {
      const doc = wrapWords(r.doc, 72);
      const comment =
        doc.length === 1
          ? `    /** ${doc[0]} */`
          : `    /** ${doc[0]}\n${doc
              .slice(1)
              .map((l) => `     * ${l}`)
              .join("\n")} */`;
      return `${comment}\n    val ${r.name} = ${r.light.blur}.dp`;
    });
    return `// Do not edit directly, this file was auto-generated.
package com.kozmos.tokens

import androidx.compose.ui.unit.dp

/**
${header.map((l) => (l ? ` * ${l}` : " *")).join("\n")}
 */
object ${className} {
${members.join("\n\n")}
}
`;
  },
});

StyleDictionary.registerFormat({
  name: "ios-swift/shadows",
  format: ({ dictionary, options }) => {
    const className = options.className || "KozmosShadows";
    const roles = elevationRoles(dictionary);
    const tuple = (c) => `(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
    const aliases = aliasList(roles);
    const alphas = (layers) => layers.map((l) => l.a).join("+");
    const lightAlphas = roles.map((r) => alphas(r.lightLayers)).join(" / ");
    const darkAlphas = roles.map((r) => alphas(r.darkLayers)).join(" / ");
    const doc = (text, indent = "") =>
      wrapWords(text, 76 - indent.length)
        .map((l) => `${indent}/// ${l}`)
        .join("\n");
    const header = [
      doc(
        `The ${roles.length === 3 ? "three " : ""}elevation roles, mirroring \`Semantics.Elevation\` in \`packages/tokens\`${aliases ? ` — which aliases ${aliases} — ` : " "}in both themes. \`pnpm tokens:elevation:check\` holds every number in this file to \`tokens-light.json\` and \`tokens-dark.json\`.`,
      ),
      "///",
      doc(
        `Dark mode deepens the alpha — ${lightAlphas} becomes ${darkAlphas} — so a surface still reads as lifted against a dark page.`,
      ),
    ].join("\n");
    const members = [
      `${doc(
        "Flush: casts nothing. Not a step on the scale — it is what a surface meeting an edge needs, and having it here keeps a conditional at a call site reading as a role rather than reverting to a literal.",
        "    ",
      )}
    public static let none = ShadowToken(color: .clear, radius: 0, x: 0, y: 0)`,
      ...roles.map((r) =>
        r.lightLayers.length === 1
          ? `${doc(r.doc, "    ")}
    public static let ${r.name} = ShadowToken(color: kozmosShadowColor(light: ${tuple(r.light)}, dark: ${tuple(r.dark)}), radius: ${r.light.blur}, x: ${r.light.x}, y: ${r.light.y})`
          : // SwiftUI's radius draws as a CSS blur twice its size — radius 8
            // reached 18pt where a CSS blur of 8 reaches 11px (measured
            // 2026-09-28 with ImageRenderer) — so a layer carries half its
            // blur, and draws as the web and Figma do. The single-layer roles
            // still carry the blur itself, as they always have.
            `${doc(r.doc, "    ")}
    ///
${doc(
  "Apply it with `kozmosElevation(_:in:fill:)`. Each layer's radius is half its CSS blur: SwiftUI's radius draws as a blur twice its size.",
  "    ",
)}
    public static let ${r.name}: [ShadowToken] = [
${r.lightLayers
  .map(
    (light, i) =>
      `        ShadowToken(color: kozmosShadowColor(light: ${tuple(light)}, dark: ${tuple(r.darkLayers[i])}), radius: ${light.blur / 2}, x: ${light.x}, y: ${light.y}),`,
  )
  .join("\n")}
    ]`,
      ),
    ];
    return `// Do not edit directly, this file was auto-generated.
import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

${header}
public struct ShadowToken {
    public let color: Color
    public let radius: CGFloat
    public let x: CGFloat
    public let y: CGFloat

    public init(color: Color, radius: CGFloat, x: CGFloat, y: CGFloat) {
        self.color = color
        self.radius = radius
        self.x = x
        self.y = y
    }
}

/// A shadow colour that follows the appearance. Resolved at draw time, so a
/// \`static let\` built from it still changes when the appearance does.
func kozmosShadowColor(
    light: (Double, Double, Double, Double),
    dark: (Double, Double, Double, Double)
) -> Color {
    #if canImport(UIKit)
    return Color(UIColor { traits in
        let c = traits.userInterfaceStyle == .dark ? dark : light
        return UIColor(red: c.0, green: c.1, blue: c.2, alpha: c.3)
    })
    #elseif canImport(AppKit)
    return Color(NSColor(name: nil, dynamicProvider: { appearance in
        let c = appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua ? dark : light
        return NSColor(red: c.0, green: c.1, blue: c.2, alpha: c.3)
    }))
    #else
    return Color(red: light.0, green: light.1, blue: light.2, opacity: light.3)
    #endif
}

public struct ${className} {
${members.join("\n\n")}
}

extension View {
    /// Apply an elevation role. Prefer this over a bare \`.shadow(...)\`: a
    /// literal is how the platform drifted to fifteen different shadows in the
    /// first place, and \`pnpm tokens:elevation:check\` counts what is left.
    public func kozmosElevation(_ token: ShadowToken) -> some View {
        shadow(color: token.color, radius: token.radius, x: token.x, y: token.y)
    }

    /// Apply a layered elevation role to a surface of this shape and fill.
    ///
    /// Each layer is cast by its own copy of the surface, behind the view.
    /// SwiftUI's \`.shadow\` shadows everything before it, shadows included, so
    /// layers stacked on one view would cast shadows of shadows. The copies are
    /// filled as the surface is, so where one shows, the surface does.
    public func kozmosElevation<S: Shape, F: ShapeStyle>(
        _ layers: [ShadowToken],
        in shape: S,
        fill: F
    ) -> some View {
        background {
            ZStack {
                ForEach(layers.indices, id: \\.self) { index in
                    shape
                        .fill(fill)
                        .shadow(
                            color: layers[index].color,
                            radius: layers[index].radius,
                            x: layers[index].x,
                            y: layers[index].y
                        )
                }
            }
        }
    }
}
`;
  },
});

// ---- Effects: the glass surface role -----------------------------------
// `Semantics.Effect.glass` is what the glass surface role is composed from:
// the tint's opacity, the blur and saturation of what shows through, the
// noise, the edge and the refraction opacities. The same numbers in both
// modes — the theme decides the tint's colour, not the effect — so a token
// that differs between modes is refused, as a shadow's geometry is.
const GLASS_FIELDS = [
  "opacity",
  "blur",
  "saturation",
  "noise.opacity",
  "border.opacity",
  "refraction.opacity",
];
const GLASS_DOC =
  "The glass surface role's effect, mirroring `Semantics.Effect.glass` in `packages/tokens`: the tint's opacity, the blur and saturation of what shows through, the noise, edge and refraction opacities. The same numbers in both themes — the theme decides the tint's colour, not the effect. `pnpm tokens:glass:check` holds every number here to the token files.";
function glassEffect(dictionary) {
  const values = {};
  for (const token of dictionary.allTokens) {
    const path = token.path;
    if (
      path.length < 4 ||
      path[0] !== "Semantics" ||
      path[1] !== "Effect" ||
      path[2] !== "glass"
    )
      continue;
    const key = path.slice(3).join(".");
    const light = Number(token.value ?? token.$value);
    const dark = Number(
      (token.attributes && token.attributes.darkValue) ?? light,
    );
    if (!Number.isFinite(light))
      throw new Error(`effects: Semantics.Effect.glass.${key} is not a number`);
    if (light !== dark)
      throw new Error(
        `effects: Semantics.Effect.glass.${key} differs between modes (${light} / ${dark}); the theme decides the tint, not the effect`,
      );
    values[key] = light;
  }
  for (const field of GLASS_FIELDS)
    if (!(field in values))
      throw new Error(`effects: Semantics.Effect.glass.${field} is missing`);
  return values;
}

StyleDictionary.registerFormat({
  name: "ios-swift/effects",
  format: ({ dictionary, options }) => {
    const className = options.className || "KozmosEffects";
    const g = glassEffect(dictionary);
    const doc = wrapWords(GLASS_DOC, 76)
      .map((l) => `/// ${l}`)
      .join("\n");
    return `// Do not edit directly, this file was auto-generated.
import CoreGraphics

${doc}
public struct GlassEffectToken {
    public let opacity: CGFloat
    public let blur: CGFloat
    public let saturation: CGFloat
    public let noiseOpacity: CGFloat
    public let borderOpacity: CGFloat
    public let refractionOpacity: CGFloat

    public init(opacity: CGFloat, blur: CGFloat, saturation: CGFloat, noiseOpacity: CGFloat, borderOpacity: CGFloat, refractionOpacity: CGFloat) {
        self.opacity = opacity
        self.blur = blur
        self.saturation = saturation
        self.noiseOpacity = noiseOpacity
        self.borderOpacity = borderOpacity
        self.refractionOpacity = refractionOpacity
    }
}

public enum ${className} {
    public static let semanticsEffectGlass = GlassEffectToken(opacity: ${g.opacity}, blur: ${g.blur}, saturation: ${g.saturation}, noiseOpacity: ${g["noise.opacity"]}, borderOpacity: ${g["border.opacity"]}, refractionOpacity: ${g["refraction.opacity"]})
}
`;
  },
});

// ---- Motion: durations and easings -------------------------------------
// `Semantics.Motion.duration.*` and `Semantics.Motion.easing.*` are what every
// transition between a component's states is timed with, on all three
// platforms; the values are the prototype's own curves, measured. The CSS
// build emits them as they are; these read them for the native packages.
const MOTION_DOC =
  "The motion tokens, mirroring `Semantics.Motion` in `packages/tokens`: three durations — quick for a state's small change, standard for a layout change, deliberate for a large move — and two easings, standard (ease out and settle) and emphasised (a small overshoot). `pnpm tokens:motion:check` holds every number here to the token files.";
function motionTokens(dictionary) {
  const values = {};
  for (const token of dictionary.allTokens) {
    const path = token.path;
    if (path[0] !== "Semantics" || path[1] !== "Motion") continue;
    if (path[2] === "duration" && path[3] !== "scale") {
      const ms = /^(\d+(?:\.\d+)?)ms$/.exec(String(token.value ?? token.$value));
      if (!ms) throw new Error(`motion: Semantics.Motion.duration.${path[3]} is not a duration in ms`);
      values[`duration.${path[3]}`] = Number(ms[1]);
    }
    if (path[2] === "easing") {
      const m = /^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/.exec(String(token.value ?? token.$value));
      if (!m) throw new Error(`motion: Semantics.Motion.easing.${path[3]} is not a cubic-bezier`);
      values[`easing.${path[3]}`] = m.slice(1, 5).map(Number);
    }
  }
  for (const field of ["duration.quick", "duration.standard", "duration.deliberate", "easing.standard", "easing.emphasised"]) {
    if (!(field in values)) throw new Error(`motion: Semantics.Motion.${field} is missing`);
  }
  return values;
}

StyleDictionary.registerFormat({
  name: "ios-swift/motion",
  format: ({ dictionary, options }) => {
    const className = options.className || "KozmosMotion";
    const m = motionTokens(dictionary);
    const doc = wrapWords(MOTION_DOC, 76).map((l) => `/// ${l}`).join("\n");
    const bezier = (v) => `CubicBezierToken(x1: ${v[0]}, y1: ${v[1]}, x2: ${v[2]}, y2: ${v[3]})`;
    return `// Do not edit directly, this file was auto-generated.
import CoreGraphics
import SwiftUI

${doc}
public struct CubicBezierToken {
    public let x1: CGFloat
    public let y1: CGFloat
    public let x2: CGFloat
    public let y2: CGFloat

    public init(x1: CGFloat, y1: CGFloat, x2: CGFloat, y2: CGFloat) {
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
    }

    /// The curve as SwiftUI draws it, over a duration in seconds.
    public func animation(duration: TimeInterval) -> Animation {
        .timingCurve(x1, y1, x2, y2, duration: duration)
    }
}

public enum ${className} {
    /// Seconds.
    public static let semanticsMotionDurationQuick: TimeInterval = ${(m["duration.quick"] / 1000).toFixed(3)}
    public static let semanticsMotionDurationStandard: TimeInterval = ${(m["duration.standard"] / 1000).toFixed(3)}
    public static let semanticsMotionDurationDeliberate: TimeInterval = ${(m["duration.deliberate"] / 1000).toFixed(3)}
    public static let semanticsMotionEasingStandard = ${bezier(m["easing.standard"])}
    public static let semanticsMotionEasingEmphasised = ${bezier(m["easing.emphasised"])}

    /// The standard curve over the quick, standard and deliberate durations.
    public static var quick: Animation { semanticsMotionEasingStandard.animation(duration: semanticsMotionDurationQuick) }
    public static var standard: Animation { semanticsMotionEasingStandard.animation(duration: semanticsMotionDurationStandard) }
    public static var deliberate: Animation { semanticsMotionEasingStandard.animation(duration: semanticsMotionDurationDeliberate) }
    /// The emphasised curve over the standard duration: a small overshoot.
    public static var emphasised: Animation { semanticsMotionEasingEmphasised.animation(duration: semanticsMotionDurationStandard) }
}
`;
  },
});

StyleDictionary.registerFormat({
  name: "android-compose/motion",
  format: ({ dictionary, options }) => {
    const className = options.className || "KozmosMotion";
    const m = motionTokens(dictionary);
    const doc = wrapWords(MOTION_DOC, 76).map((l) => ` * ${l}`).join("\n");
    const bezier = (v) => `CubicBezierEasing(${v[0]}f, ${v[1]}f, ${v[2]}f, ${v[3]}f)`;
    return `// Do not edit directly, this file was auto-generated.
package com.kozmos.tokens

import androidx.compose.animation.core.CubicBezierEasing

/**
${doc}
 */
object ${className} {
    /** Milliseconds. */
    const val semanticsMotionDurationQuick: Int = ${Math.round(m["duration.quick"])}
    const val semanticsMotionDurationStandard: Int = ${Math.round(m["duration.standard"])}
    const val semanticsMotionDurationDeliberate: Int = ${Math.round(m["duration.deliberate"])}
    val semanticsMotionEasingStandard: CubicBezierEasing = ${bezier(m["easing.standard"])}
    val semanticsMotionEasingEmphasised: CubicBezierEasing = ${bezier(m["easing.emphasised"])}
}
`;
  },
});

StyleDictionary.registerFormat({
  name: "android-compose/effects",
  format: ({ dictionary, options }) => {
    const className = options.className || "KozmosEffects";
    const g = glassEffect(dictionary);
    const doc = wrapWords(GLASS_DOC, 76)
      .map((l) => ` * ${l}`)
      .join("\n");
    return `// Do not edit directly, this file was auto-generated.
package com.kozmos.tokens

/**
${doc}
 */
data class GlassEffectToken(
    val opacity: Float,
    val blur: Float,
    val saturation: Float,
    val noiseOpacity: Float,
    val borderOpacity: Float,
    val refractionOpacity: Float
)

object ${className} {
    val semanticsEffectGlass = GlassEffectToken(
        opacity = ${g.opacity}f,
        blur = ${g.blur}f,
        saturation = ${g.saturation}f,
        noiseOpacity = ${g["noise.opacity"]}f,
        borderOpacity = ${g["border.opacity"]}f,
        refractionOpacity = ${g["refraction.opacity"]}f
    )
}
`;
  },
});

StyleDictionary.registerFormat({
  name: "pointr/color-palette",
  format: ({ dictionary, file }) => {
    const colors = {};
    dictionary.allTokens.forEach((token) => {
      const isColor =
        (token.attributes && token.attributes.category === "color") ||
        token.type === "color" ||
        token.$type === "color" ||
        token.path[0] === "color" ||
        token.name.toLowerCase().includes("color");
      if (isColor) {
        // Pointr MapLibre style JSON expects snake_case for Python $var regex compatibility
        const name = token.name.replace(/-/g, "_");
        let val =
          token.value ||
          token.$value ||
          (token.original && token.original.value) ||
          (token.original && token.original.$value);

        colors[name] = val;
      }
    });

    const isDark = file.destination.includes("dark");
    const payload = {
      name: `Kozmos Design System (${isDark ? "Dark" : "Light"})`,
      description: "Automatically synced from Kozmos Design System Tokens",
      created_at: new Date().toISOString(),
      colors: colors,
      updated_at: new Date().toISOString(),
    };

    return JSON.stringify(payload, null, 2);
  },
});

async function build() {
  try {
    // 1. Light Mode (CSS)
    console.log("\n☀️  Building Light Mode...");
    const sdLight = new StyleDictionary({
      log: { verbosity: "verbose" },
      source: ["src/tokens-light.json"],
      platforms: {
        css: {
          transformGroup: "css",
          buildPath: "dist/css/",
          files: [
            {
              destination: "variables-light.css",
              format: "css/variables",
              options: { selector: ":root" },
            },
          ],
        },
        ...optionalPointrPlatform("kozmos-light.json"),
      },
    });
    await sdLight.buildAllPlatforms();

    // 2. Dark Mode (CSS)
    console.log("\n🌙  Building Dark Mode...");
    const sdDark = new StyleDictionary({
      source: ["src/tokens-dark.json"],
      platforms: {
        css: {
          transformGroup: "css",
          buildPath: "dist/css/",
          files: [
            {
              destination: "variables-dark.css",
              format: "css/variables",
              options: { selector: "[data-theme='dark']" },
            },
          ],
        },
        ...optionalPointrPlatform("kozmos-dark.json"),
      },
    });
    await sdDark.buildAllPlatforms();

    // 3. JS
    console.log("\n📦  Building JS/TS...");
    const sdJS = new StyleDictionary({
      source: ["src/tokens-light.json"],
      platforms: {
        js: {
          transformGroup: "js",
          buildPath: "dist/js/",
          files: [
            { destination: "tokens.js", format: "javascript/module-flat" },
            { destination: "tokens.mjs", format: "javascript/es6" },
            {
              destination: "tokens.d.ts",
              format: "typescript/es6-declarations",
            },
            // The same declarations as an ES module. Without them, an ESM
            // consumer resolving with node16 got tokens.d.ts — CommonJS types,
            // as the package has no "type" field — for the ESM tokens.mjs:
            // "masquerading as CJS" to @arethetypeswrong/cli.
            {
              destination: "tokens.d.mts",
              format: "typescript/es6-declarations",
            },
          ],
        },
      },
    });
    await sdJS.buildAllPlatforms();

    // 4. Android
    console.log("\n🤖 Building Android (XML Resources)...");
    const sdAndroidLight = new StyleDictionary({
      source: ["src/tokens-light.json"],
      platforms: {
        android: {
          transforms: [
            "attribute/cti",
            "name/snake",
            "color/hex8android",
            "size/remToSp",
            "size/kozmos/dp",
          ],
          buildPath: "dist/android/src/main/res/values/",
          files: [
            {
              destination: "colors.xml",
              format: "android/resources",
              options: { outputReferences: true },
            },
          ],
        },
      },
    });
    await sdAndroidLight.buildAllPlatforms();
    fixAndroidXML("dist/android/src/main/res/values/colors.xml");

    const sdAndroidDark = new StyleDictionary({
      source: ["src/tokens-dark.json"],
      platforms: {
        android: {
          transforms: [
            "attribute/cti",
            "name/snake",
            "color/hex8android",
            "size/remToSp",
            "size/kozmos/dp",
          ],
          buildPath: "dist/android/src/main/res/values-night/",
          files: [
            {
              destination: "colors.xml",
              format: "android/resources",
              options: { outputReferences: true },
            },
          ],
        },
      },
    });
    await sdAndroidDark.buildAllPlatforms();
    fixAndroidXML("dist/android/src/main/res/values-night/colors.xml");

    StyleDictionary.registerFilter({
      name: "isColor",
      filter: function (token) {
        return token.$type === "color" || token.type === "color";
      },
    });

    StyleDictionary.registerFilter({
      name: "isSemanticOrComponentColor",
      filter: function (token) {
        const isColor = token.$type === "color" || token.type === "color";
        return (
          isColor &&
          (token.path.includes("Semantics") ||
            token.path.includes("semantics") ||
            token.path.includes("Components") ||
            token.path.includes("components"))
        );
      },
    });

    const sdAndroidCompose = new StyleDictionary({
      source: ["src/tokens-light.json"],
      platforms: {
        androidCompose: {
          transforms: [
            "attribute/cti",
            "name/camel",
            "color/composeColor",
            "size/compose/em",
            "size/compose/remToSp",
            "size/kozmos/composeDp",
          ],
          buildPath: "dist/android/src/main/java/com/kozmos/tokens/",
          files: [
            {
              destination: "KozmosColors.kt",
              format: "android-compose/exact",
              filter: "isColor",
              options: { className: "KozmosColors" },
            },
            {
              destination: "KozmosDesignTokens.kt",
              format: "android-compose/exact",
              filter: "isSemanticOrComponentColor",
              options: { className: "KozmosDesignTokens" },
            },
            {
              destination: "KozmosThemeTokens.kt",
              format: "android-compose/themed",
              filter: "isColor",
            },
          ],
        },
      },
    });
    await sdAndroidCompose.buildAllPlatforms();

    const sdAndroidComposeDimensions = new StyleDictionary({
      source: ["src/tokens-light.json"],
      platforms: {
        androidCompose: {
          transforms: [
            "attribute/cti",
            "name/camel",
            "color/composeColor",
            "size/compose/em",
            "size/compose/remToSp",
            "size/kozmos/composeDp",
          ],
          buildPath: "dist/android/src/main/java/com/kozmos/tokens/",
          files: [
            {
              destination: "KozmosDimensions.kt",
              format: "android-compose/dimensions",
              options: { className: "KozmosDimensions" },
            },
            {
              destination: "KozmosShadows.kt",
              format: "android-compose/shadows",
              options: { className: "KozmosShadows" },
            },
            {
              destination: "KozmosEffects.kt",
              format: "android-compose/effects",
              options: { className: "KozmosEffects" },
            },
            {
              destination: "KozmosMotion.kt",
              format: "android-compose/motion",
              options: { className: "KozmosMotion" },
            },
          ],
        },
      },
    });
    await sdAndroidComposeDimensions.buildAllPlatforms();

    const sdAndroidComposeDark = new StyleDictionary({
      source: ["src/tokens-dark.json"],
      platforms: {
        androidCompose: {
          transforms: [
            "attribute/cti",
            "name/camel",
            "color/composeColor",
            "size/compose/em",
            "size/compose/remToSp",
            "size/kozmos/composeDp",
          ],
          buildPath: "dist/android/src/main/java/com/kozmos/tokens/",
          files: [
            {
              destination: "KozmosColorsDark.kt",
              format: "android-compose/exact",
              filter: "isColor",
              options: { className: "KozmosColorsDark" },
            },
          ],
        },
      },
    });
    await sdAndroidComposeDark.buildAllPlatforms();

    // The themed accessor is built from the light tokens and names the dark
    // palette for every colour, so the two palettes must name the same
    // colours. A colour only one theme has is refused here, by name, rather
    // than as a Gradle error in the package or a colour Compose cannot theme.
    {
      const dir = "dist/android/src/main/java/com/kozmos/tokens/";
      const names = (file, pattern) =>
        new Set(
          [...fs.readFileSync(dir + file, "utf8").matchAll(pattern)].map(
            (m) => m[1],
          ),
        );
      const light = names("KozmosColors.kt", /^ {2}val (\w+) = Color\(/gm);
      const dark = names("KozmosColorsDark.kt", /^ {2}val (\w+) = Color\(/gm);
      const themed = names("KozmosThemeTokens.kt", /^ {4}val (\w+): Color$/gm);
      const only = (a, b) => [...a].filter((name) => !b.has(name));
      const problems = [
        ...only(light, dark).map((n) => `${n} is light-only`),
        ...only(dark, light).map((n) => `${n} is dark-only`),
        ...only(light, themed).map((n) => `${n} has no themed accessor`),
        ...only(themed, light).map((n) => `${n} is themed but in no palette`),
      ];
      if (problems.length)
        throw new Error(
          `The Compose palettes disagree (${problems.length}): ${problems.join("; ")}`,
        );
      console.log(
        `✔︎ KozmosThemeTokens.kt themes all ${themed.size} colours of both palettes`,
      );
    }

    // 5. iOS (Swift Dynamic)
    console.log("\n🍎 Building iOS (Dynamic Swift)...");

    // Load and Merge Tokens
    const lightTokens = JSON.parse(
      fs.readFileSync("src/tokens-light.json", "utf8"),
    );
    const darkTokens = JSON.parse(
      fs.readFileSync("src/tokens-dark.json", "utf8"),
    );

    // Mutate lightTokens
    const mergedTokens = mergeDarkTokens(lightTokens, darkTokens);
    fs.writeFileSync(
      "src/tokens-merged-temp.json",
      JSON.stringify(mergedTokens, null, 2),
    );

    const sdIOS = new StyleDictionary({
      log: { verbosity: "verbose" },
      source: ["src/tokens-merged-temp.json"],
      platforms: {
        ios: {
          transforms: ["attribute/cti", "name/kozmos/camel"],
          buildPath: "dist/ios/",
          files: [
            {
              destination: "KozmosColors.swift",
              format: "ios-swift/dynamic",
              options: {
                className: "KozmosColors",
              },
            },
            {
              destination: "KozmosDimensions.swift",
              format: "ios-swift/dimensions",
              options: {
                className: "KozmosDimensions",
              },
            },
            {
              destination: "KozmosShadows.swift",
              format: "ios-swift/shadows",
              options: {
                className: "KozmosShadows",
              },
            },
            {
              destination: "KozmosEffects.swift",
              format: "ios-swift/effects",
              options: {
                className: "KozmosEffects",
              },
            },
            {
              destination: "KozmosMotion.swift",
              format: "ios-swift/motion",
              options: {
                className: "KozmosMotion",
              },
            },
          ],
        },
      },
    });
    await sdIOS.buildAllPlatforms();

    if (fs.existsSync("src/tokens-merged-temp.json"))
      fs.unlinkSync("src/tokens-merged-temp.json");

    console.log("\n✅ Build Complete.");
  } catch (error) {
    console.error("❌ Build Failed:", error);
    if (fs.existsSync("src/tokens-merged-temp.json"))
      fs.unlinkSync("src/tokens-merged-temp.json");
    process.exit(1);
  }
}

build();
