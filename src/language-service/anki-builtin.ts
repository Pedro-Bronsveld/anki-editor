import { TEMPLATE_LANGUAGE_ID } from "../constants";
import { docsLink } from "../documentation";
import { flagsList } from "./anki-flags";
import { filterExample, quotedCodeBlock, rubyFilterExample } from "./filter-examples";

export interface BuiltIn {
    name: string;
    description: string;
    htmlDescription?: boolean;
    requiredPrecedingFilter?: string;
}

export type BuiltInFilter = BuiltIn & {
    fieldRequired: boolean;
}

// Built-in special fields

export const specialFieldsList: readonly BuiltIn[] = [
    {
        name: "Card",
        description: "Contains the name of the card template that this field is used in." +
            docsLink("Card Templates", "https://docs.ankiweb.net/templates/intro.html")
    },
    {
        name: "CardFlag",
        description: "Contains the name of the flag the active card is marked with.\n\n" +
            "Available flag colors and names:\n\n" +
            "|Flag Color|Name|\n" +
            "|----------|----|\n" +
            flagsList.map(({name, color}, index) => `|<span style="color:#${color};">⚑</span> ${name}|\`flag${index}\`|`).join("\n") +
            docsLink("Using Flags", "https://docs.ankiweb.net/editing.html#using-flags"),
        htmlDescription: true
    },
    {
        name: "Deck",
        description: "Contains the name of the deck that the active card is in." +
            docsLink("Deck Options", "https://docs.ankiweb.net/deck-options.html")
    },
    {
        name: "Subdeck",
        description: "Contains the name of the subdeck that the active card is directly nested in.\n\n" +
            "If the card is not in a subdeck, this field contains the same value as the `Deck` field." +
            docsLink("Subdecks", "https://docs.ankiweb.net/deck-options.html#subdecks")
    },
    {
        name: "Tags",
        description: "Contains the names of the tags that are attached to the active card.\n\n" +
            "If multiple tags are attached to a card, the tag names will be separated by a single space.\n\n" +
            "For example:\n" +
            "- One tag: `\"tag_1\"`\n" +
            "- Two tags: `\"tag_1 tag_2\"`" +
            docsLink("Using Tags", "https://docs.ankiweb.net/editing.html#using-tags")
    },
    {
        name: "Type",
        description: "Contains the name of the note type that the active card is a part of." +
            docsLink("Note Types", "https://docs.ankiweb.net/getting-started.html#note-types")
    },
    {
        name: "FrontSide",
        description: "This field is used on the back template of a card to embed the corresponding front template." +
            docsLink("Basic Replacements", "https://docs.ankiweb.net/templates/fields.html#basic-replacements") +
            docsLink("Special Fields", "https://docs.ankiweb.net/templates/fields.html#special-fields")
    },
];

// Built-in filters

export const builtinFiltersList: readonly BuiltInFilter[] = [
    {
        name: "tts",
        description: "Converts the value of the field in this replacement to spoken words.\n\n" +
            "Must be followed directly by a language code such as `en_US`.\n\n" +
            "### Example\n\n" +
            quotedCodeBlock(TEMPLATE_LANGUAGE_ID, "{{tts en_US:Field}}") + "\n\n" +
            "### Options Example\n\n" +
            "The options `voices` and `speed` can optionally be used to set the voice used for conversion, and the speed at which the audio is played.\n\n" +
            quotedCodeBlock(TEMPLATE_LANGUAGE_ID, "{{tts en_US voices=Microsoft_George speed=1.0:Field}}") +
            docsLink("Text to Speech", "https://docs.ankiweb.net/templates/fields.html#text-to-speech"),
        fieldRequired: true
    },
    {
        name: "tts-voices",
        description: "Displays a list of tts languages and voices available on the system the card or card preview is rendered on.\n\n" +
            "### Example\n\n" +
            quotedCodeBlock(TEMPLATE_LANGUAGE_ID, "{{tts-voices:}}") +
            docsLink("Text to Speech", "https://docs.ankiweb.net/templates/fields.html#text-to-speech"),
        fieldRequired: false
    },
    {
        name: "cloze",
        description: "Hides the part of the field content that's marked as a cloze deletion in the field's content.\n\n" +
            "**Note:** Cloze deletions may only be used on the cloze note type and on note types created by cloning the cloze note type.\n\n" +
            filterExample(
                "{{cloze:Field}}",
                "This is a {{c1::sample}} cloze deletion.",
                {
                    front: "This is a **[...]** cloze deletion.",
                    back: "This is a **sample** cloze deletion."
                }) +
            docsLink("Cloze Deletion", "https://docs.ankiweb.net/editing.html#cloze-deletion"),
        fieldRequired: true
    },
    {
        name: "cloze-only",
        description: "When used in combination with the `tts` filter, only the deleted text will be read.\n\n" +
            "### Example\n\n" +
            quotedCodeBlock(TEMPLATE_LANGUAGE_ID, "{{tts en_US:cloze-only:Field}}") +
            docsLink("Text to Speech", "https://docs.ankiweb.net/templates/fields.html#text-to-speech"),
        fieldRequired: true
    },
    {
        name: "hint",
        description: "Hides the content of the field until clicked.\n\n" +
            filterExample("{{hint:Field}}", "This is some hint text.", "[Field](https://docs.ankiweb.net/templates/fields.html#hint-fields)") + "\n\n" +
            "When the 'Field' text is clicked, the field's content is revealed:\n\n" +
            quotedCodeBlock("text", "This is some hint text.") +
            docsLink("Hint Fields", "https://docs.ankiweb.net/templates/fields.html#hint-fields"),
        fieldRequired: true
    },
    {
        name: "type",
        description: "Displays a text input for the user to type in their answer when used on the front of a card template.\n\n" +
            "Displays the correct and incorrect letters of the user's input when also used on the back of the card template.\n\n" +
            "### Example\n\n" +
            quotedCodeBlock(TEMPLATE_LANGUAGE_ID, "{{type:Field}}") +
            docsLink("Checking Your Answer", "https://docs.ankiweb.net/templates/fields.html#checking-your-answer"),
        fieldRequired: true
    },
    {
        name: "text",
        description: "Displays the source content of the field without any formatting.\n\n" +
            filterExample("{{text:Field}}", "**Bold** and *Italic* text.", "Bold and Italic text.", true) +
            docsLink("HTML Stripping", "https://docs.ankiweb.net/templates/fields.html#html-stripping"),
        fieldRequired: true
    },
    {
        name: "furigana",
        description: "Allows for the use of logographic and ruby characters in a field.\n\n" +
            "Ruby characters will be displayed above the logographic characters.\n\n" +
            rubyFilterExample("furigana") +
            docsLink("Ruby Characters", "https://docs.ankiweb.net/templates/fields.html#ruby-characters"),
        htmlDescription: true,
        fieldRequired: true
    },
    {
        name: "kana",
        description: "Allows for the use of logographic and ruby characters in a field.\n\n" +
            "Only the ruby characters will be displayed.\n\n" +
            rubyFilterExample("kana") +
            docsLink("Additional Ruby Character Filters", "https://docs.ankiweb.net/templates/fields.html#additional-ruby-character-filters"),
        fieldRequired: true
    },
    {
        name: "kanji",
        description: "Allows for the use of logographic and ruby characters in a field.\n\n" +
            "Only the logographic characters will be displayed.\n\n" +
            rubyFilterExample("kanji") +
            docsLink("Additional Ruby Character Filters", "https://docs.ankiweb.net/templates/fields.html#additional-ruby-character-filters"),
        fieldRequired: true
    },
    {
        name: "nc",
        description: "Ignores characters combined with other characters, such as diacritics, when comparing the typed input to the field's content.\n\n" +
            "Can only be used directly after the 'type' filter.\n\n" +
            "### Example\n\n" +
            quotedCodeBlock(TEMPLATE_LANGUAGE_ID, "{{type:nc:Field}}"),
        fieldRequired: true,
        requiredPrecedingFilter: "type"
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
            "Use the `tts-voices` filter on a card template to display a list of available voices on a system." +
            docsLink("Text to Speech", "https://docs.ankiweb.net/templates/fields.html#text-to-speech"),
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
            "For example: to increase the speed by 50%, a value of `1.5` can be set." +
            docsLink("Text to Speech", "https://docs.ankiweb.net/templates/fields.html#text-to-speech"),
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
        "Use the `tts-voices` filter on a card template to display a list of available tts languages on a system." +
        docsLink("Text to Speech", "https://docs.ankiweb.net/templates/fields.html#text-to-speech")
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
        description: "Conditional 'if filled' opening tag, used to check if a field contains content. Must be matched by a `/` closing tag."
    },
    "^": {
        name: "^",
        description: "Conditional 'if empty' opening tag, used to check if a field is empty. Must be matched by a `/` closing tag."
    },
    "/": {
        name: "/",
        description: "Conditional block closing tag, closes a conditional block opened by a `#` or `^` opening tag."
    }
} as const;

export const getConditionalExample = (openChar: "#" | "^" = "#") =>
    quotedCodeBlock(TEMPLATE_LANGUAGE_ID, 
    `{{${openChar}Field}}\n` +
    "    ...\n" +
    "{{/Field}}\n");

// Standard replacement description
export const standardReplacementDescription = "Replacement in this card template.\n\n" +
    "This will be replaced by the content of a note's field when Anki renders the card.\n\n" +
    filterExample("Hello, {{Field}}", "World", "Hello, World") +
    docsLink("Basic Replacements", "https://docs.ankiweb.net/templates/fields.html#basic-replacements");

// Conditional cloze field

export const getClozeFieldDescription = (exampleField: string) =>
    "References a cloze deletion number in a note's field.\n\n" +
    "Content in this conditional block will only be visible if the field of a note " +
    "contains a cloze deletion with a matching number.\n\n" +
    "### Field Example\n\n" +
    quotedCodeBlock("text", `Some {{${exampleField}::Hidden Text}}`) +
    docsLink("Conditional Cloze Templates", "https://docs.ankiweb.net/templates/generation.html?highlight=conditional#cloze-templates");
