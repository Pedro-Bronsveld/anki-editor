import * as vscode from "vscode";
import { builtinCssClasses, builtinCssClassesList } from "../anki-builtin";
import { 
    newCSSDataProvider,
    TextDocument as CssTextDocument, 
    CompletionItemKind as CssCompletionItemKind,
    DocumentUri as CssDocumentUri,
    FileStat as CssFileStat, 
    FileType as CssFileType, 
    LanguageService as CssLanguageService,
    getCSSLanguageService } from "vscode-css-languageservice";
import AnkiConnect from "../../anki-connect/anki-connect";

export default class StylingCompletionItemProvider implements vscode.CompletionItemProvider {

    private cssLanguageService: CssLanguageService;

    constructor(ankiConnect: AnkiConnect) {
        this.cssLanguageService = getCSSLanguageService({
            useDefaultDataProvider: true,
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
            })],
            fileSystemProvider: {
                async stat(uri: CssDocumentUri): Promise<CssFileStat> {
                    return {
                        type: CssFileType.Unknown,
                        ctime: 0,
                        mtime: 0,
                        size: 0
                    }
                },            
                async readDirectory(uri: CssDocumentUri): Promise<[string, CssFileType][]> {
                    const fileNames = (await ankiConnect.getMediaFilesNames("_*"));
                    return fileNames.map(fileName => [fileName, CssFileType.File]);
                }
            }
        });
    }

    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {

        const completionItemList: vscode.CompletionItem[] = [];

        // CSS Parsing
        const cssTextDocument = CssTextDocument.create(document.uri.toString(), document.languageId, document.version, document.getText());
        const stylesheet = this.cssLanguageService.parseStylesheet(cssTextDocument);
        
        // Get all css completion items, filter out only Anki built-in completion items
        const allCssCompletions = await this.cssLanguageService.doComplete2(cssTextDocument, position, stylesheet, {
            resolveReference(ref: string, baseUrl: string): string | undefined { 
                return ref;
            }
        });
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

        // Provide completion items for media files
        const fileCompletionItems = allCssCompletions.items.filter(item => item.kind === CssCompletionItemKind.File);

        completionItemList.push(...fileCompletionItems
            .map<vscode.CompletionItem>(cssCompletionItem => new vscode.CompletionItem(cssCompletionItem.label, vscode.CompletionItemKind.File)));

        return completionItemList;
    }
}
