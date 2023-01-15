// Character 173 is used as escape character because it's invisible when used
// as the name of a file or folder in the VSCode file explorer.

export const escapeText = (rawText: string): string =>
    rawText
        // Replace any escape characters (char 173 or unicode 0xAD) 
        // with a double escape character.
        .replace(/\xAD/g, "\xAD\xAD")
        // Replace forward slashes with an escape character followed by a
        // space, a division character (unicode 0x2215), and another space.
        // This is a workaround to display text with forward slashes
        // in the workspace file browser.
        .replace(/\//g, "\xAD \u2215 ");

export const unescapeText = (escapedText: string): string =>
    escapedText
        // Replace escaped division character with regular
        // forward slash.
        .replace(/\xAD \u2215 /g, "/")
        // Replace double escape characters with single
        // escape characters.
        .replace(/\xAD\xAD/g, "\xAD");

// Handle a somewhat unrealistic edge case for card names.
// A card name could have the name "Styling.css".
// This would interfere with the "Styling.css" file that's in the same
// note type folder.
// If there is a card with the name "Styling.css", put an escape character
// at the end of the directory name.

export const escapeCardName = (rawCardName: string): string =>
    escapeText(rawCardName)
        // Add escape character to end of card name
        // when card name is "Styling.css".
        .replace(/^Styling.css$/, "Styling.css\xAD");

export const unescapeCardName = (encodedCardName: string): string =>
    unescapeText(
        // Remove escape character from end of card name
        // when card is "Styling.css"
        encodedCardName.replace(/^Styling.css\xAD$/, "Styling.css"));
