import { TransformedToken, PlatformConfig } from "style-dictionary";

export function transformFontFamily(token: TransformedToken) {
    // Handle font family spaces
    const typographyTokenValue = token.$value ?? token.value;
    if (Object.hasOwn(typographyTokenValue, "fontFamily") && typographyTokenValue.fontFamily) {
        const fontFamilies = typographyTokenValue.fontFamily.split(",").map((value: string) => {
            const trimmedValue = value.trim();
            const containsSpace = trimmedValue.includes(" ");
            return containsSpace ? `"${trimmedValue}"` : trimmedValue;
        });

        // Adds fallback font
        typographyTokenValue.fontFamily = fontFamilies.join(", ") + ", " + "sans-serif";
    }

    return typographyTokenValue;
}

export function transformLineHeight(token: TransformedToken, platform: PlatformConfig) {
    const typographyTokenValue = token.$value ?? token.value;
    if (Object.hasOwn(typographyTokenValue, "lineHeight") && typographyTokenValue.lineHeight) {
        const lineHeight = typographyTokenValue.lineHeight.toString();
        if (lineHeight.endsWith("%")) {
            typographyTokenValue.lineHeight = (parseFloat(lineHeight) / 100).toFixed(3);
        } else if (platform.options?.lineHeightUnit) {
            typographyTokenValue.lineHeight = parseFloat(lineHeight) + platform.options.lineHeightUnit;
        } else {
            const newLineHeight = parseFloat(lineHeight) / parseFloat(typographyTokenValue.fontSize);
            typographyTokenValue.lineHeight = newLineHeight.toFixed(3);
        }
    }

    return typographyTokenValue;
}

export function transformLetterSpacing(token: TransformedToken, platform: PlatformConfig) {
    const typographyTokenValue = token.$value ?? token.value;
    if (Object.hasOwn(typographyTokenValue, "letterSpacing") && typographyTokenValue.letterSpacing) {
        const letterSpacing = typographyTokenValue.letterSpacing;
        const shouldAddUnit = parseFloat(letterSpacing) != 0;
        const letterSpacingUnit = platform.options?.letterSpacingUnit ?? "px";
        typographyTokenValue.letterSpacing = letterSpacing + (shouldAddUnit ? letterSpacingUnit : "");
    }

    return typographyTokenValue;
}
