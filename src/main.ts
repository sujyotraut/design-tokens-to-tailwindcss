import postcss from "postcss";
import postcssJs from "postcss-js";
import StyleDictionary from "style-dictionary";
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
                const breakpoints: Record<string, string> = options.breakpoints ?? {};
                let typographyTokens: { [key: string]: string | Record<string, string> } = {};

                for (const [name, tokens] of Map.groupBy(dictionary.allTokens, ({ path }) => path.slice(1).join("-"))) {
                    const tokensRecord: Record<string, TransformedToken | undefined> = {};

                    Object.keys(breakpoints).forEach(
                        (breakpoint) => (tokensRecord[breakpoint] = tokens.find(({ path }) => path[0] === breakpoint))
                    );

                    const typographyUtility = createTypographyUtility("typography-" + name, tokensRecord, breakpoints);
                    typographyTokens = Object.assign(typographyTokens, typographyUtility);
                }

                const result = await postcss().process(typographyTokens, { from: undefined, parser: postcssJs });
                return result.css;
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
                    filter: isTypography,
                    format: "tailwindcss",
                    destination: "app.css",
                },
            ],
        },
    },
});

await styleDictionary.cleanAllPlatforms();
await styleDictionary.buildAllPlatforms();
