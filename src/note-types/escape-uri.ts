// Character 173 is used as escape character because it's invisible when used
// as the name of a file or folder in the VSCode file explorer.

export const encodeEscape = (rawText: string): string => {
    return rawText
        // Replace any escape characters (char 173 or unicode 0xAD) 
        // with a double escape character.
        .replace(/\xAD/g, `\xAD\xAD`)
        // Replace forward slashes with an escape character followed by a
        // space, a division character (unicode 0x2215), and another space.
        // This is a workaround to display text with forward slashes
        // in the workspace file browser.
        .replace(/\//g, `\xAD \u2215 `);
}

export const decodeEscape = (encodedText: string): string => {
    return encodedText
        // Replace escaped division character with regular
        // forward slash.
        .replace(/\xAD \u2215 /g, "/")
        // Replace double escape characters with single
        // escape characters.
        .replace(/\xAD\xAD/g, "\xAD");
}