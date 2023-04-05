import { createRubyPreview } from "./ruby-preview";

export const filterExample = (cardTemplate: string, fieldContent: string, rendered: string | { front: string, back: string }, rawFieldContent: boolean = false): string =>
`### Example

With the card template:

${ quotedCodeBlock("anki-template", cardTemplate) }

Where the \`Field\` of a note contains the text:

${ rawFieldContent ? prefixQuote(fieldContent) : quotedCodeBlock("text", fieldContent) }

#### Rendered
` +
(typeof rendered === "string"
? `
The card will be rendered as:
${ prefixQuote(rendered) }
`
: `
The **front** of the card will be rendered as:
${ prefixQuote(rendered.front) }

The **back** of the card will be rendered as:
${ prefixQuote(rendered.back) }
`);

const prefixQuote = (text: string): string => text.split("\n").map(line => "> " + line).join("\n");

const codeBlock = (language: string, code: string) =>
`\`\`\`${language}
${code}
\`\`\``;

export const quotedCodeBlock = (language: string, code: string) => prefixQuote(codeBlock(language, code));

// Ruby filters example builder functions

export const rubyFilterExample = (filter: "furigana" | "kana" | "kanji"): string => {

    const text = "日本語";
    const ruby = "にほんご";

    const example = (rendered: string): string => filterExample(`{{${filter}:Field}}`, `${text}[${ruby}]`, rendered);

    switch (filter) {
        case "furigana":
            return example(createRubyPreview(text, ruby));
        case "kana":
            return example(ruby);
        case "kanji":
            return example(text);
    }
}

export const docsLink = (title: string, link: string) =>
    `\n\n[Anki Docs - ${title}](${link})\n\n`;
