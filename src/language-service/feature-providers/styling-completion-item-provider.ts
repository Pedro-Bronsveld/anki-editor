import * as vscode from "vscode";
import { builtinCssClasses, builtinCssClassesList } from "../anki-builtin";
import EmbeddedHandler from "../embedded-handler";
import { getCSSLanguageService, newCSSDataProvider, TextDocument as CssTextDocument, ClientCapabilities, getSCSSLanguageService, CompletionItemKind as CssCompletionItemKind } from "vscode-css-languageservice";

export default class StylingCompletionItemProvider implements vscode.CompletionItemProvider {

    private cssLanguageService = getSCSSLanguageService({
        useDefaultDataProvider: false,
        customDataProviders: [newCSSDataProvider({
            version: 1.1,
            pseudoClasses: builtinCssClassesList.map(builtinCss => ({
                name: builtinCss.name,
                description: {
                    kind: "markdown",
                    value: builtinCss.description
                }
            })),
            properties: [{
                name: "DUMMY_PROPERTY",
                status: "nonstandard"
            }]
        })]
    })

    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {

        const completionItemList: vscode.CompletionItem[] = [];

        // CSS Parsing
        const cssTextDocument = CssTextDocument.create(document.uri.toString(), document.languageId, document.version, document.getText());
        const stylesheet = this.cssLanguageService.parseStylesheet(cssTextDocument);
        
        // Get all css completion items, filter out only Anki built-in completion items
        const allCssCompletions = this.cssLanguageService.doComplete(cssTextDocument, position, stylesheet);
        // Only show Anki selectors when no properties are provided
        const ankiCompletionItems = (allCssCompletions.items.some(item => item.kind === CssCompletionItemKind.Property)
                ? []
                : allCssCompletions.items)
            .filter(item => item.kind === CssCompletionItemKind.Function)
            .filter(item => builtinCssClasses.has(item.label));

        completionItemList.push(...ankiCompletionItems.map<vscode.CompletionItem>(cssCompletionItem => {
            const completionItem = new vscode.CompletionItem(cssCompletionItem.label,
                vscode.CompletionItemKind.Class);
            completionItem.documentation = typeof cssCompletionItem.documentation === "object"
                ? new vscode.MarkdownString(cssCompletionItem.documentation.value)
                : undefined;
            return completionItem;
        }));

        return completionItemList;
    }
}
