
/**
 * Creates a ruby html preview for use in markdown strings with html support.
 * By default vscode renders the ruby characters very small in an on hover.
 * A combination of `<h2>` and the `codicon` class is used as a workaround to get
 * the desired font-size for ruby characters in a hover markdown string.
 * 
 * The `<h2>` tag increases the font size, but also makes the text bold,
 * the `codicon` class then sets the `font-weight` to `normal`.
 * 
 * @param text base text that the ruby characters belong to.
 * @param ruby characters that will be displayed above the base text.
 * @returns an html string that can be used in a `vscode.MarkdownString`
 * class with `supportHtml` set to true.
 */
export const createRubyPreview = (text: string, ruby: string): string =>
`<h2>
    <span class="codicon codicon-ruby-workaround">
        <ruby>
            <rb>
                <span class="codicon codicon-ruby-workaround">
                    ${ text }
                </span>
            </rb>
            <rt>
                ${ ruby }
            </rt>
        </ruby>
    </span>
</h2>`;

export const rubyFilterExample = (filter: "furigana" | "kana" | "kanji"): string => {

    const text = "日本語";
    const ruby = "にほんご";

    const example = rubyFilterDescriptionBase(filter, text, ruby);

    switch (filter) {
        case "furigana":
            return example + createRubyPreview(text, ruby);
        case "kana":
            return example + ruby;
        case "kanji":
            return example + text;
    }
}

export const rubyFilterDescriptionBase = (filter:string, text: string, ruby: string): string =>
`For example, with the card template:
\`\`\`anki-template
{{${filter}:Field}}
\`\`\`

Where the \`Field\` of a note contains the text:

\`\`\`text
${text}[${ruby}]
\`\`\`

The card will be rendered as:

`;
