import { toKebabCase } from "@std/text";
import StyleDictionary from "style-dictionary";
import { transforms } from "style-dictionary/enums";
import { register } from "@tokens-studio/sd-transforms";
import type { Config, TransformedToken } from "style-dictionary/types";

register(StyleDictionary);

const styleDictionary = new StyleDictionary({
    usesDtcg: true,
    source: ["tokens/tokens.json"],
    preprocessors: ["tokens-studio"],
    log: { verbosity: "verbose" },
    hooks: {
        transforms: {
            "tailwindcss/typography": {
                type: "value",
                filter: isTypography,
                transform: (token) => {
                    const typographyToken = (token.$value ?? token.value) as Record<string, string>;
                    return Object.entries(typographyToken).reduce(reducerFunction, "");
                },
            },
        },
        formats: {
            tailwindcss: ({ dictionary }) => {
                return dictionary.allTokens.reduce((accumulator, current) => {
                    return (accumulator += createTypographyUtility(current)) + "\n";
                }, "");
            },
        },
    },
    platforms: {
        css: {
            transformGroup: "tokens-studio",
            transforms: [transforms.nameKebab],
            buildPath: "build/css/",
            files: [
                {
                    format: "css/variables",
                    destination: "app.css",
                },
            ],
        },
        tailwindcss: {
            // transformGroup: "tokens-studio",
            transforms: [transforms.nameKebab, "tailwindcss/typography"],
            buildPath: "build/tailwind/",
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

function isTypography(token: TransformedToken, options: Config) {
    return (options.usesDtcg ? token.$type : token.type) === "typography";
}

function reducerFunction(
    accumulator: string,
    [key, value]: [string, string],
    currentIndex: number,
    array: [string, string][],
) {
    const newLine = currentIndex === array.length - 1 ? "" : "\n";
    return accumulator + `${toKebabCase(key)}: ${value};${newLine}`;
}

function createTypographyUtility(token: TransformedToken) {
    const typographyToken = token.$value ?? token.value;
    return `.${token.name} {\n${addIndent(typographyToken, 4)}\n}\n`;
}

function addIndent(text: string, indent: number) {
    return text
        .split("\n")
        .map((line) => " ".repeat(indent) + line)
        .join("\n");
}
