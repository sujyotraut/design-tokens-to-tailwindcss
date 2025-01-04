import postcss from "postcss";
import postcssJs from "postcss-js";
import StyleDictionary from "style-dictionary";
import { partition } from "@std/collections/partition";
import { toKebabCase } from "@std/text/to-kebab-case";
import { register } from "@tokens-studio/sd-transforms";
import type { TransformedToken } from "style-dictionary/types";
import { createTypographyUtility, isTypography } from "./utils.ts";
import { transformFontFamily, transformLetterSpacing, transformLineHeight } from "./transforms.ts";

register(StyleDictionary, { withSDBuiltins: false });

const styleDictionary = new StyleDictionary({
    usesDtcg: true,
    source: ["tokens/tokens.json"],
    preprocessors: ["tokens-studio"],
    log: { verbosity: "verbose" },
    hooks: {
        transforms: {
            "css/typography/lineHeight": {
                type: "value",
                filter: isTypography,
                transform: transformLineHeight,
            },
            "css/typography/letterSpacing": {
                type: "value",
                filter: isTypography,
                transform: transformLetterSpacing,
            },
            "css/typography/fontFamily": {
                type: "value",
                filter: isTypography,
                transform: transformFontFamily,
            },
        },
        formats: {
            tailwindcss: async ({ dictionary, options }) => {
                const [compositeTokens, tokens] = partition(dictionary.allTokens, (transformedToken) => {
                    const tokenType = transformedToken.$type ?? transformedToken.type;
                    return ["border", "shadow", "typography"].includes(tokenType ?? "");
                });

                // #region Tokens
                const cssVariables: { ":root": Record<string, string> } = { ":root": {} };
                tokens.forEach(({ name, $value, value }) => (cssVariables[":root"]["--" + toKebabCase(name)] = $value ?? value));
                // #endregion

                const compositeTokensMap = Map.groupBy(compositeTokens, ({ $type, type }) => $type ?? type);

                // #region Border tokens
                const borderTokens = compositeTokensMap.get("border") ?? [];
                // #endregion

                // #region Shadow tokens
                const shadowTokens = compositeTokensMap.get("shadow") ?? [];
                // #endregion

                // #region Typography tokens
                const typographyTokens = compositeTokensMap.get("typography") ?? [];
                const breakpoints: Record<string, string> = options.breakpoints ?? {};
                let typographyUtilities: { [key: string]: string | Record<string, string> } = {};

                for (const [name, tokens] of Map.groupBy(typographyTokens, ({ path }) => path.slice(1).join("-"))) {
                    const tokensRecord: Record<string, TransformedToken | undefined> = {};

                    Object.keys(breakpoints).forEach((breakpoint) => (tokensRecord[breakpoint] = tokens.find(({ path }) => path[0] === breakpoint)));

                    const typographyUtility = createTypographyUtility("typography-" + name, tokensRecord, breakpoints);
                    typographyUtilities = Object.assign(typographyUtilities, typographyUtility);
                }
                // #endregion

                const cssInJs = Object.assign(cssVariables, typographyUtilities);
                const result = await postcss().process(cssInJs, { from: undefined, parser: postcssJs });
                return result.css.replaceAll("@utility", "\n@utility");
            },
        },
    },
    platforms: {
        tailwindcss: {
            transformGroup: "tokens-studio",
            transforms: ["css/typography/fontFamily", "css/typography/lineHeight", "css/typography/letterSpacing"],
            buildPath: "build/",
            options: {
                letterSpacingUnit: "px",
                lineHeightUnit: "px",
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
