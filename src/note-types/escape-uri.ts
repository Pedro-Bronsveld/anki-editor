// The Zero-width space character (unicode character 0x200B or code point 8203)
// is used as escape character in uri's because it's invisible when used in the
// name of a file or folder in the VSCode file explorer.

export const escapeText = (rawText: string): string =>
    rawText
        // Replace any escape character with a double escape character.
        .replace(/\u200B/g, "\u200B\u200B")
        // Replace forward slashes with an escape character followed by a
        // space, a division character (unicode 0x2215), and another space.
        // This is a workaround to display text with forward slashes
        // in the VSCode file browser.
        // This is necessary because note types and card names are allowed
        // to contain forward slashes.
        .replace(/\//g, "\u200B \u2215 ");

export const unescapeText = (escapedText: string): string =>
    escapedText
        // Replace escaped division character with regular forward slash.
        .replace(/\u200B \u2215 /g, "/")
        // Replace double escape characters with single escape characters.
        .replace(/\u200B\u200B/g, "\u200B");

// Handle a somewhat unrealistic edge case for card names.
// A card name could have the name "Styling.css".
// This would interfere with the "Styling.css" file that's in the same
// note type folder.
// If there is a card with the name "Styling.css", put an escape character
// at the end of the directory name to prevent this naming conflict.

export const escapeCardName = (rawCardName: string): string =>
    escapeText(rawCardName)
        // Add escape character to end of card name
        // when card name is exactly "Styling.css".
        .replace(/^(Styling.css)$/, "$1\u200B");

export const unescapeCardName = (escapedCardName: string): string =>
    unescapeText(
        // Remove escape character from end of card name
        // when card name is exactly "Styling.css"
        escapedCardName.replace(/^(Styling.css)\u200B$/, "$1"));
