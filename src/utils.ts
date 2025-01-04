import type { TransformedToken } from "style-dictionary";

export function isTypography(token: TransformedToken) {
    const tokenType = token.$type ?? token.type;
    return tokenType === "typography";
}

export function createTypographyUtility(
    name: string,
    tokensRecord: Record<string, TransformedToken | undefined>,
    breakpoints: Record<string, string>
) {
    const defaultBreakpoint = Object.keys(breakpoints)[0];
    if (!defaultBreakpoint) throw Error("No default breakpoint");

    const defaultTypographyToken = tokensRecord[defaultBreakpoint];
    if (!defaultTypographyToken) throw Error("No default typography token");

    const defaultTokenValue = defaultTypographyToken.$value ?? defaultTypographyToken.value;

    const atRule = `@utility ${name}`;
    const typographyToken = { [atRule]: { ...defaultTokenValue } };

    for (const breakpoint of Object.keys(breakpoints).slice(1)) {
        const breakpointToken = tokensRecord[breakpoint];
        if (!breakpointToken) continue;

        const breakpointTokenValue = breakpointToken.$value ?? breakpointToken.value;
        const mediaQuery = `@media (min-width: ${breakpoints[breakpoint]})`;
        typographyToken[atRule][mediaQuery] = breakpointTokenValue;
    }

    return typographyToken;
}
