import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";
import type { TransformedToken } from "style-dictionary/types";
import { transformFontFamily, transformLetterSpacing, transformLineHeight } from "./transforms.ts";
import { createTypographyUtility, isTypography } from "./utils.ts";

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
            tailwindcss: ({ dictionary, options }) => {
                let result = "";

                function comparatorFunction(a: TransformedToken, b: TransformedToken) {
                    const sortSample = ["mobile", "tablet", "desktop"];
                    return sortSample.indexOf(a.path[0]) - sortSample.indexOf(b.path[0]);
                }

                for (const [key, values] of Map.groupBy(dictionary.allTokens, ({ path }) => path.slice(1).join("-"))) {
                    const sortedValues = values.sort(comparatorFunction).map(({ $value, value }) => $value ?? value);
                    result += createTypographyUtility(key, sortedValues, options.breakpoints);
                }

                return result;
            },
        },
    },
    platforms: {
        tailwindcss: {
            transformGroup: "tokens-studio",
            transforms: ["css/typography/fontFamily", "css/typography/lineHeight", "css/typography/letterSpacing"],
            buildPath: "build/",
            options: {
                breakpoints: ["768px", "1024px", "1280px"],
                letterSpacingUnit: "px",
                lineHeightUnit: "px",
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
