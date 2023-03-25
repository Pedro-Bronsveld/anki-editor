import * as vscode from "vscode";
import { builtinCssClassesList } from "../anki-builtin";

export default class StylingCompletionItemProvider implements vscode.CompletionItemProvider {

    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {

        const completionItemList: vscode.CompletionItem[] = [];

        // Provide css completion items for built-in css selectors
        completionItemList.push(...builtinCssClassesList.map(builtinCss => {
            const completionItem = new vscode.CompletionItem(builtinCss.name,
                vscode.CompletionItemKind.Class);
            completionItem.documentation = new vscode.MarkdownString(builtinCss.description);
            return completionItem;
        }));

        return completionItemList;
    }
    
}