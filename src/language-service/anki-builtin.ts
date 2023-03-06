export interface BuiltIn {
    name: string;
    description: string;
}

const specialFieldsList: readonly BuiltIn[] = [
    {
        name: "Card",
        description: "Contains the type name of the card template that this field is used in."
    },
    {
        name: "CardFlag",
        description: "If a card is marked with a flag, this variable will contain the name of the flag it's marked with.\n\n" +
            "The 7 available flag colors and names are:\n" +
            "|Flag|Name|\n" +
            "|----|----|\n" +
            ["Red", "Orange", "Green", "Blue", "Pink", "Turquoise", "Purple"].map((color, index) => `|${color}|\`flag${index+1}\`|`).join("\n")
    },
    {
        name: "Deck",
        description: "Contains the name of the deck that the active card is in."
    },
    {
        name: "Subdeck",
        description: "Contains the name of the subdeck that the active card is directly nested in.\n" +
            "If the card is not in a subdeck, this field contains the same value as the `Deck` field."
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
    {
        name: "FrontSide",
        description: "This field is used on the back template of a card to embed the corresponding front template."
    },
];

export const builtinFiltersList: readonly BuiltIn[] = [
    {
        name: "tts-voices",
        description: "Displays a list of all available languages/voices in the card."
    },
    {
        name: "cloze",
        description: "Displays the field in this replacement as a cloze deletion."
    },
    {
        name: "cloze-only",
        description: "When used in combination with the `tts` filter, only the deleted text will be read.\n" +
            "Example: `{{tts en_US:cloze-only:Text}}`."
    },
    {
        name: "hint",
        description: "Hides the content of the field until the user clicks it."
    },
    {
        name: "type",
        description: "Displays a text input for the user to type in their answer when used on the front of a card template.\n" +
            "Displays a the correct and incorrect letters of the user's input when also used on the back of the card template."
    },
    {
        name: "text",
        description: "Displays the source content of the field without any formatting."
    },
    {
        name: "furigana",
        description: "Allows for the usage of logographic and ruby characters in a field.\nRuby characters will be displayed above the logographic characters of the field."
    },
    {
        name: "kana",
        description: "Allows for the usage of logographic and ruby characters in a field.\nOnly the ruby characters will be displayed."
    },
    {
        name: "kanji",
        description: "Allows for the usage of logographic and ruby characters in a field.\nOnly the logographic characters will be displayed."
    }
];

const toMap = <T extends BuiltIn>(builtins: readonly T[]): Map<string, T> => new Map(builtins.map(builtin => [builtin.name, builtin]));
const toNames = <T extends BuiltIn>(builtins: readonly T[]): readonly string[] => builtins.map(({ name }) => name);

export const specialFields = toMap(specialFieldsList);
export const specialFieldsNames = toNames(specialFieldsList.filter(({ name }) => name !== "FrontSide"));

export const builtinFilters = toMap(builtinFiltersList);
export const builtinFiltersNames = toNames(builtinFiltersList);
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
