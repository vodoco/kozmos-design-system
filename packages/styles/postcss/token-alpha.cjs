// Tailwind cannot apply /alpha to an opaque var() string. Use its documented
// colour callback so the role remains a live token (including consumer overrides),
// and opacity is applied to the resolved colour, not to the whole element.
function withTokenAlpha(colors) {
  return Object.fromEntries(
    Object.entries(colors).map(([name, value]) => {
      if (value && typeof value === "object")
        return [name, withTokenAlpha(value)];
      if (typeof value !== "string" || !value.startsWith("var("))
        return [name, value];
      return [
        name,
        ({ opacityValue, opacityVariable } = {}) => {
          // Tailwind supplies opacityVariable for a plain (non-slash) utility.
          // Preserve the original var() declaration in that case. Only /alpha is
          // part of this contract; legacy bg-opacity-* was never supported here.
          if (
            opacityVariable !== undefined ||
            opacityValue === undefined ||
            Number(opacityValue) === 1
          )
            return value;
          return `color-mix(in srgb, ${value} calc(${opacityValue} * 100%), transparent)`;
        },
      ];
    }),
  );
}
module.exports = { withTokenAlpha };
