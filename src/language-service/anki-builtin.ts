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

export interface TtsKeyValueArg {
    key: string;
    value: string;
    validMatch: RegExp;
    invalidMessage: string;
    multiple: boolean;
}

export const ttsKeyValueArgs: readonly TtsKeyValueArg[] = [
    { 
        key: "voices",
        value: "Voice_Name",
        validMatch: /^[^\s]+$/,
        invalidMessage: "Invalid value format for voices option.\n" +
            "Value must be a single voice name or a comma separated list of voice names.\n" +
            "Use the 'tts-voices:' filter to see a list of available voices",
        multiple: true
    },
    { 
        key: "speed",
        value: "1.0",
        validMatch: /^\d*\.?\d*$/,
        invalidMessage: "Invalid decimal number.\n" +
        "The value for the speed option must be a decimal number, using '.' as the decimal separator.\n" +
        "For example: 1.5",
        multiple: false
    }
];

export const ttsKeyValueArgsMap: Map<string, TtsKeyValueArg> = 
    new Map(ttsKeyValueArgs.map(keyValueArg => [keyValueArg.key, keyValueArg]));
