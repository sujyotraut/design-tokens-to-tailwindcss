import postcss from "postcss";
import postcssJs from "postcss-js";
import StyleDictionary from "style-dictionary";
import { partition } from "@std/collections/partition";
import { toKebabCase } from "@std/text/to-kebab-case";
import { register } from "@tokens-studio/sd-transforms";
import type { TransformedToken } from "style-dictionary/types";
import type { CssInJs } from "postcss-js";

register(StyleDictionary, { withSDBuiltins: false });

const styleDictionary = new StyleDictionary({
    usesDtcg: true,
    source: ["tokens/tokens.json"],
    preprocessors: ["tokens-studio"],
    log: { verbosity: "verbose" },
    hooks: {
        transforms: {
            "css/typography": {
                type: "value",
                filter: isTypography,
                transform: (token, platform) => {
                    const typographyTokenValue = token.$value ?? token.value;

                    if (Object.hasOwn(typographyTokenValue, "fontFamily") && typographyTokenValue.fontFamily) {
                        const fontFamilies = typographyTokenValue.fontFamily.split(",").map((value: string) => {
                            const trimmedValue = value.trim();
                            const containsSpace = trimmedValue.includes(" ");
                            return containsSpace ? `"${trimmedValue}"` : trimmedValue;
                        });

                        typographyTokenValue.fontFamily = fontFamilies.join(", ") + ", " + "sans-serif";
                    }

                    if (Object.hasOwn(typographyTokenValue, "lineHeight") && typeof typographyTokenValue.lineHeight === "string") {
                        const lineHeight = typographyTokenValue.lineHeight;
                        const lineHeightUnit = platform.lineHeightUnit ?? "px";
                        const hasUnit = !/\d$/.test(lineHeight);
                        typographyTokenValue.lineHeight = hasUnit ? lineHeight : parseFloat(lineHeight) + lineHeightUnit;
                    }

                    if (Object.hasOwn(typographyTokenValue, "letterSpacing")) {
                        const letterSpacing = typographyTokenValue.letterSpacing;
                        const letterSpacingUnit = platform.letterSpacingUnit ?? "px";
                        const isZero = parseFloat(letterSpacing) === 0;
                        const hasUnit = !/\d$/.test(letterSpacing);
                        if (isZero) typographyTokenValue.letterSpacing = "0";
                        else typographyTokenValue.letterSpacing = hasUnit ? letterSpacing : parseFloat(letterSpacing) + letterSpacingUnit;
                    }

                    if (Object.hasOwn(typographyTokenValue, "textCase") && typographyTokenValue.textCase) {
                        const textCase = typographyTokenValue.textCase;
                        delete typographyTokenValue.textCase;
                        typographyTokenValue.textTransform = textCase;
                    }

                    return typographyTokenValue;
                },
            },
        },
        formats: {
            tailwindcss: async ({ dictionary, options }) => {
                const [compositeTokens, tokens] = partition(dictionary.allTokens, (transformedToken) => {
                    const tokenType = transformedToken.$type ?? transformedToken.type;
                    return ["border", "shadow", "typography"].includes(tokenType ?? "");
                });

                let cssInJs: CssInJs = { "@import 'tailwindcss'": true };

                // #region Tokens
                const cssInJsVariables: CssInJs = tokens.length > 0 ? { ":root": {} } : {};
                tokens.forEach(({ name, $value, value }) => (cssInJsVariables[":root"]["--" + toKebabCase(name)] = $value ?? value));
                cssInJs = Object.assign(cssInJs, cssInJsVariables);
                // #endregion

                const compositeTokensMap = Map.groupBy(compositeTokens, ({ $type, type }) => $type ?? type);

                // #region Border tokens
                // const borderTokens = compositeTokensMap.get("border") ?? [];
                const cssInJsBorders = {};
                cssInJs = Object.assign(cssInJs, cssInJsBorders);
                // #endregion

                // #region Shadow tokens
                // const shadowTokens = compositeTokensMap.get("shadow") ?? [];
                const cssInJsShadows = {};
                cssInJs = Object.assign(cssInJs, cssInJsShadows);
                // #endregion

                // #region Typography tokens
                const typographyTokens = compositeTokensMap.get("typography") ?? [];
                const breakpoints: Record<string, string> = options.breakpoints ?? {};

                for (const [name, tokens] of Map.groupBy(typographyTokens, ({ path }) => path.slice(1).join("-"))) {
                    const tokensRecord: Record<string, TransformedToken | undefined> = {};

                    Object.keys(breakpoints).forEach((breakpoint) => (tokensRecord[breakpoint] = tokens.find(({ path }) => path[0] === breakpoint)));

                    const typographyUtility = createTypographyUtility("typography-" + name, tokensRecord, breakpoints);
                    cssInJs = Object.assign(cssInJs, typographyUtility);
                }
                // #endregion

                const result = await postcss().process(cssInJs, { from: undefined, parser: postcssJs });
                return result.css.replace(":root", "\n:root").replaceAll("@utility", "\n@utility");
            },
        },
    },
    platforms: {
        tailwindcss: {
            transformGroup: "tokens-studio",
            transforms: ["css/typography"],
            buildPath: "build/",
            options: {
                breakpoints: {
                    mobile: "360px",
                    tablet: "theme(screens.md)",
                    desktop: "theme(screens.xl)",
                },
            },
            files: [
                {
                    format: "tailwindcss",
                    destination: "app.css",
                },
            ],
        },
    },
});

await styleDictionary.cleanAllPlatforms();
await styleDictionary.buildAllPlatforms();

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
