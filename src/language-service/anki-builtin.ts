export interface BuiltIn {
    name: string;
    description: string;
}

const specialFieldsList: readonly BuiltIn[] = [
    {
        name: "Card",
        description: "Contains the type name of the card template that this variable is used in."
    },
    {
        name: "CardFlag",
        description: "If a card is marked with a flag, this variable will contain the name of the flag it's marked with.\n\n" +
            "The 7 available flag colors and names are:\n" +
            "|Color|Name|\n" +
            "|-----|----|\n" +
            ["Red", "Orange", "Green", "Blue", "Pink", "Turquoise", "Purple"].map((color, index) => `|${color}|\`flag${index+1}\`|`).join("\n")
    },
    {
        name: "Deck",
        description: "Contains the name of the deck that the active card is in."
    },
    {
        name: "Subdeck",
        description: "Contains the name of the subdeck, if any, that the active card is in."
    },
    {
        name: "Tags",
        description: "Contains the names of the tags that are attached to the active card.\n" +
            "If multiple tags are attached to a card, the tag names will be sepparated by spaces.\n" +
            "For example:\n" +
            "- One tag: `tag_1`\n" +
            "- Two tags: `tag_1 tag_2`"
    },
    {
        name: "Type",
        description: "Contains the name of the note type that the active card is a part of."
    },
];

export const builtinFilters: readonly BuiltIn[] = [
    {
        name: "tts-voices",
        description: ""
    },
    {
        name: "cloze",
        description: ""
    },
    {
        name: "cloze-only",
        description: ""
    },
    {
        name: "hint",
        description: ""
    },
    {
        name: "type",
        description: ""
    },
    {
        name: "text",
        description: ""
    },
    {
        name: "furigana",
        description: ""
    },
    {
        name: "kana",
        description: ""
    },
    {
        name: "kanji",
        description: ""
    }
];

const toMap = <T extends BuiltIn>(builtins: readonly T[]): Map<string, T> => new Map(builtins.map(builtin => [builtin.name, builtin]));
const toNames = <T extends BuiltIn>(builtins: readonly T[]): readonly string[] => builtins.map(({ name }) => name);

export const specialFields = toMap(specialFieldsList);
export const specialFieldsNames = toNames(specialFieldsList);

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
