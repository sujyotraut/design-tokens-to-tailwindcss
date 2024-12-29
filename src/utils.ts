import { toKebabCase } from "@std/text/to-kebab-case";
import type { TokenTypographyValue } from "@tokens-studio/types";
import type { TransformedToken } from "style-dictionary";

export function isTypography(token: TransformedToken) {
    const tokenType = token.$type ?? token.type;
    return tokenType === "typography";
}

export function createTypographyUtility(
    name: string,
    tokens: TokenTypographyValue[],
    breakpoints: string[] = [],
): string {
    const firstToken = addIndent(tokenTypographyValueToString(tokens[0]), 4);
    let tailwindUtility = `@utility typography-${name} {\n` + firstToken;

    for (const [i, transformedToken] of tokens.slice(1).entries()) {
        const token = addIndent(tokenTypographyValueToString(transformedToken), 8);
        tailwindUtility += addIndent(`\n@media (min-width: ${breakpoints[i]}) {\n`, 4);
        tailwindUtility += token + "\n";
        tailwindUtility += addIndent("}\n", 4);
    }

    tailwindUtility += "}\n\n";
    return tailwindUtility;
}

function tokenTypographyValueToString(typographyToken: TokenTypographyValue): string {
    return Object.entries(typographyToken).reduce((accumulator, [key, value]) => {
        // const newLine = currentIndex === array.length - 1 ? "" : "\n";
        return accumulator + `${toKebabCase(key).trim()}: ${value.toString().trim()};\n`;
    }, "");
}

function addIndent(text: string, indent: number): string {
    return text
        .split("\n")
        .map((line) => " ".repeat(indent) + line)
        .join("\n")
        .trimEnd()
        .concat("\n");
}
