export const specialFields: readonly string[] = [
    "Card",
    "CardFlag",
    "Deck",
    "Subdeck",
    "Tags",
    "Type",
];

export const builtinFilters: readonly string[] = [
    "tts-voices",
    "cloze",
    "cloze-only",
    "hint",
    "type",
    "text",
    "furigana",
    "kana",
    "kanji"
];

export const ttsKeyValueArgs: readonly { key: string, value: string }[] = [
    { key: "voices", value: "Voice_Name" },
    { key: "speed", value: "1.0" }
];
