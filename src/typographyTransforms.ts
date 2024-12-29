import { TransformedToken, PlatformConfig } from "style-dictionary";

export function transformFontFamily(token: TransformedToken) {
    // const tokenValue = token.$value ?? token.value;
    // const tokenType = token.$type ?? token.type;
    //
    // if (tokenType === "fontFamily") {
    //     const containsSpace = tokenValue.trim().includes(" ");
    //     return containsSpace ? `"${tokenValue}"` : tokenValue;
    // }
    //
    // const typographyTokenValue = tokenValue as TokenTypographyValue;

    // Handle font family spaces
    const typographyTokenValue = token.$value ?? token.value;
    if (Object.hasOwn(typographyTokenValue, "fontFamily") && typographyTokenValue.fontFamily) {
        const fontFamilies = typographyTokenValue.fontFamily.split(",").map((value: string) => {
            const containsSpace = value.trim().includes(" ");
            return containsSpace ? `"${value}"` : value;
        });

        // Adds fallback font
        typographyTokenValue.fontFamily = fontFamilies.join(", ") + ", " + "sans-serif";
    }

    return typographyTokenValue;
}

export function transformLineHeight(token: TransformedToken) {
    const typographyTokenValue = token.$value ?? token.value;
    if (Object.hasOwn(typographyTokenValue, "lineHeight") && typographyTokenValue.lineHeight) {
        const lineHeight = typographyTokenValue.lineHeight;
        typographyTokenValue.lineHeight = parseFloat(lineHeight.toString()) / 100;
    }

    return typographyTokenValue;
}

export function transformLetterSpacing(token: TransformedToken, platform: PlatformConfig) {
    const typographyTokenValue = token.$value ?? token.value;
    if (Object.hasOwn(typographyTokenValue, "letterSpacing") && typographyTokenValue.letterSpacing) {
        const letterSpacing = typographyTokenValue.letterSpacing;
        const shouldAddUnit = parseFloat(letterSpacing) != 0;
        const letterSpacingUnit = platform.options?.typography?.letterSpacingUnit ?? "px";
        typographyTokenValue.letterSpacing = letterSpacing + (shouldAddUnit ? letterSpacingUnit : "");
    }

    return typographyTokenValue;
}
