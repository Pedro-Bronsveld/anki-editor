export interface BuiltIn {
    name: string;
    description: string;
}

// Built-in special fields

export const specialFieldsList: readonly BuiltIn[] = [
    {
        name: "Card",
        description: "Contains the type name of the card template that this field is used in."
    },
    {
        name: "CardFlag",
        description: "If a card is marked with a flag, this variable will contain the name of the flag it's marked with.\n\n" +
            "The 7 available flag colors and names are:\n\n" +
            "|Flag Color|Name|\n" +
            "|----------|----|\n" +
            ["Red", "Orange", "Green", "Blue", "Pink", "Turquoise", "Purple"].map((color, index) => `|${color}|\`flag${index+1}\`|`).join("\n")
    },
    {
        name: "Deck",
        description: "Contains the name of the deck that the active card is in."
    },
    {
        name: "Subdeck",
        description: "Contains the name of the subdeck that the active card is directly nested in.\n\n" +
            "If the card is not in a subdeck, this field contains the same value as the `Deck` field."
    },
    {
        name: "Tags",
        description: "Contains the names of the tags that are attached to the active card.\n\n" +
            "If multiple tags are attached to a card, the tag names will be separated by a single space.\n\n" +
            "For example:\n" +
            "- One tag: `\"tag_1\"`\n" +
            "- Two tags: `\"tag_1 tag_2\"`"
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

// Built-in filters

export const builtinFiltersList: readonly BuiltIn[] = [
    {
        name: "tts",
        description: "Converts the value of the field in this replacement to spoken words.\n\n" +
            "Must be followed directly by a language code such as `en_US`.\n\n" +
            "The options `voices` and `speed` can optionally be used to set the voice used for conversion, and the speed at which the audio is played.\n\n" +
            "Example usage:\n\n```anki-template\n{{tts en_US voices=Microsoft_George speed=1.0:Field}}\n```"
    },
    {
        name: "tts-voices",
        description: "Displays a list of tts languages and voices available on the system the card or card preview is rendered on."
    },
    {
        name: "cloze",
        description: "Displays the field in this replacement as a cloze deletion.\n\n" +
            "**Note:** Cloze deletions may only be used on the cloze note type and on note types created by cloning the cloze note type."
    },
    {
        name: "cloze-only",
        description: "When used in combination with the `tts` filter, only the deleted text will be read.\n\n" +
            "Example usage:\n\n```anki-template\n{{tts en_US:cloze-only:Field}}\n```"
    },
    {
        name: "hint",
        description: "Hides the content of the field until clicked."
    },
    {
        name: "type",
        description: "Displays a text input for the user to type in their answer when used on the front of a card template.\n\n" +
            "Displays the correct and incorrect letters of the user's input when also used on the back of the card template."
    },
    {
        name: "text",
        description: "Displays the source content of the field without any formatting."
    },
    {
        name: "furigana",
        description: "Allows for the usage of logographic and ruby characters in a field.\n\nRuby characters will be displayed above the logographic characters of the field."
    },
    {
        name: "kana",
        description: "Allows for the usage of logographic and ruby characters in a field.\n\nOnly the ruby characters will be displayed."
    },
    {
        name: "kanji",
        description: "Allows for the usage of logographic and ruby characters in a field.\n\nOnly the logographic characters will be displayed."
    }
];

export const toMap = <T extends BuiltIn>(builtins: readonly T[]): Map<string, T> => new Map(builtins.map(builtin => [builtin.name, builtin]));
const toNames = <T extends BuiltIn>(builtins: readonly T[]): readonly string[] => builtins.map(({ name }) => name);

export const specialFields = toMap(specialFieldsList);
export const specialFieldsNames = toNames(specialFieldsList.filter(({ name }) => name !== "FrontSide"));

export const builtinFilters = toMap(builtinFiltersList);
export const builtinFiltersNames = toNames(builtinFiltersList);

// Builtin tts filter options

export interface TtsOption extends BuiltIn {
    value: string;
    validMatch: RegExp;
    invalidMessage: string;
    multiple: boolean;
}

export const ttsOptionsList: readonly TtsOption[] = [
    { 
        name: "voices",
        description: "The `voices` options is used to specify one or more voices that will be used for text-to-speech conversion.\n\n" +
            "When multiple values are provided, each value must be sepparated by a comma.\n\n" +
            "Use the `tts-voices` filter on a card template to display a list of available voices on a system.",
        value: "Voice_Name",
        validMatch: /^[^\s]+$/,
        invalidMessage: "Invalid value format for voices option.\n\n" +
            "Value must be a single voice name or a comma separated list of voice names.\n\n" +
            "Use the 'tts-voices:' filter to see a list of available voices",
        multiple: true
    },
    { 
        name: "speed",
        description: "The `speed` option is used to specify the speed by which to speed up or slow down the spoken text as a decimal number.\n\n" +
            "By default, this is set to `1.0`.\n\n" +
            "For example: to increase the speed by 50%, a value of `1.5` can be set.",
        value: "1.0",
        validMatch: /^\d*\.?\d*$/,
        invalidMessage: "Invalid decimal number.\n\n" +
        "The value for the speed option must be a decimal number, using '.' as the decimal separator.\n\n" +
        "For example: 1.5",
        multiple: false
    }
];

export const ttsDefaultLanguage: BuiltIn = {
    name: "en_US",
    description: "Code of the language that the tts command will use for speech conversion.\n\n" +
        "Use the `tts-voices` filter on a card template to display a list of available tts languages on a system."
}

export const ttsOptions = toMap(ttsOptionsList);
export const ttsOptionsNames = toNames(ttsOptionsList);

// Builtin css selectors
// Note: this list does not include every selector Anki can add to a rendered card,
// only the selectors that seem the most useful to provide information for.

const cssTargetBases: readonly { selectors: string[], target: string }[] = [
    {
        selectors: [".win"],
        target: "Windows"
    },
    {
        selectors: [".mac"],
        target: "macOS"
    },
    {
        selectors: [".linux"],
        target: "Linux"
    },
    {
        selectors: [".mobile"],
        target: "mobile"
    },
    {
        selectors: [".iphone"],
        target: "iPhone"
    },
    {
        selectors: [".ipad"],
        target: "iPad"
    },
    {
        selectors: [".android"],
        target: "Android"
    },
    {
        selectors: [".gecko", ".firefox"],
        target: "Firefox"
    },
    {
        selectors: [".chrome"],
        target: "Google Chrome and Chromium"
    },
    {
        selectors: [".webkit", ".safari"],
        target: "Safari, Google Chrome and Chromium"
    },
    {
        selectors: [".nightMode"],
        target: "nightmode"
    }
];

export const builtinCssClassesList: readonly BuiltIn[] = [
    ...cssTargetBases.flatMap<BuiltIn>(targetBase => 
        targetBase.selectors.map(selector =>
            ({
                name: selector,
                description: `Built-in Anki CSS class to define styling for ${targetBase.target} only.`
            })
        )
    ),
    {
        name: ".card",
        description: "Built-in Anki CSS class to define styling for the current card.\n\nThis class is automatically attached to the `<body>` element of a rendered card."
    },
    {
        name: ".replay-button",
        description: "Built-in Anki CSS class to define styling for the replay button shown when audio is included in a field, or when using the `tts` filter."
    },
    {
        name: ".cloze",
        description: "Built-in Anki CSS class to define styling for a `<span>` element shown when the `cloze` filter is used in a card template."
    },
    {
        name: ".hint",
        description: "Built-in Anki CSS class to define styling for a `<a>` tag shown when the `hint` filter is used in a card template."
    },
    {
        name: "#typeans",
        description: "Built-in Anki CSS id to define styling for the text input element shown when the `type` filter is used in a card template."
    }
];

export const builtinCssClasses = toMap(builtinCssClassesList);

// Conditional characters and descriptions

export const conditionalCharacters: {
    [Char in "#" | "^" | "/"]: BuiltIn & { name: Char }
} = {
    "#": {
        name: "#",
        description: "Conditional if filled opening tag, used to check if a field contains content. Must be matched by a `/` closing tag."
    },
    "^": {
        name: "^",
        description: "Conditional if empty opening tag, used to check if a field is empty. Must be matched by a `/` closing tag."
    },
    "/": {
        name: "/",
        description: "Conditional block closing tag, closes a conditional opened by a `#` or `^` opening tag."
    }
} as const;

export const getConditionalExample = (openChar: "#" | "^" = "#") =>
    "```anki-template\n" +
    `{{${openChar}Field}}\n` +
    "    ...\n" +
    "{{/Field}}\n" +
    "```\n\n";
