import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { uriPathToParts } from '../../note-types/uri-parser';
import { builtinFilters, specialFields, ttsKeyValueArgs } from '../anki-builtin';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { AstItemType } from '../parser/ast-models';
import { getItemAtOffset, inItem } from '../parser/ast-utils';
import { parseTemplateDocument } from '../parser/template-parser';
import VirtualDocumentProvider from '../virtual-documents-provider';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateCompletionItemProvider extends LanguageFeatureProviderBase implements vscode.CompletionItemProvider {
    
    constructor(virtualDocumentProvider: VirtualDocumentProvider, private ankiModelDataProvider: AnkiModelDataProvider) {
        super(virtualDocumentProvider);
    }
    
    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {        
        const embeddedDocument = this.getEmbeddedByPosition(document, position);

        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {

            const templateDocument = parseTemplateDocument(embeddedDocument.content);

            const offset = document.offsetAt(position);
            // Find template replacement at the trigger position
            const replacement = templateDocument.replacements.find(replacement => inItem(replacement, offset));
            
            if (!replacement)
                return undefined;
            
            const completionItemList: vscode.CompletionItem[] = [];
                
            // Check if the trigger position is currently at a field position
            if (inItem(replacement.fieldSegment, offset)) {
                // Handle completions in a field segment
                
                // Suggest special fields
                completionItemList.push(...specialFields.map(fieldName => createCompletionItem(fieldName, vscode.CompletionItemKind.Constant, "3")));

                // Field suggestions from the model can only be provided on documents loaded through Anki-Connect
                if (document.uri.scheme === ANKI_EDITOR_SCHEME_BASE) {
                    const uriParts = uriPathToParts(document.uri);
        
                    if (uriParts.length >= 2) {
                        // Create field suggestions
                        const modelName = uriParts[1];
                        const fieldNames = await this.ankiModelDataProvider.getFieldNames(modelName);
                        completionItemList.push(...fieldNames.map(fieldName => createCompletionItem(fieldName, vscode.CompletionItemKind.Field, "1")));
                    }
                }

                // Show FrontSide suggestion only when in back side template
                if(replacement.type === AstItemType.replacement && document.uri.path.split("/").slice(-1)[0]?.toLowerCase().startsWith("back"))
                    completionItemList.push(createCompletionItem("FrontSide", vscode.CompletionItemKind.Reference, "2"));
            }
            
            if (replacement.type === AstItemType.replacement ) {
                const filterSegment = getItemAtOffset(replacement.filterSegments, offset);
                
                // Check if the trigger position was at the key value position inside a tts filter segment
                if (filterSegment?.filter?.content === "tts" && filterSegment.filter.arguments[0]?.end < offset ) {
                    completionItemList.push(...ttsKeyValueArgs.map(({ key, value }) => {
                            const completion = createCompletionItem(key, vscode.CompletionItemKind.Property, "1")
                            completion.insertText = new vscode.SnippetString(key + "=${0:" + value + "}");
                            return completion;
                        }
                    ));
                }
                else {
                    // Create builtin filter suggestions, ending with colon if not already followed by one
                    const appendColon = !replacement.content.substring(offset - replacement.start).match(/^\s*(?=:)/);
                    const suffix = (appendColon ? ":" : "");
                    completionItemList.push(...builtinFilters.map(filterName =>
                        createCompletionItem(filterName + suffix, vscode.CompletionItemKind.Function, "4")
                    ));
    
                    // Suggest builtin tts filter as a snippet
                    const ttsCompletion = createCompletionItem("tts en_US" + suffix, vscode.CompletionItemKind.Function, "4");
                    ttsCompletion.insertText = new vscode.SnippetString("tts ${0:en_US}" + suffix);
                    completionItemList.push(ttsCompletion);
                }
                
            }
            
            return completionItemList;
        }

        // Html, javascript and css forwarding
        const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            embeddedDocument.virtualUri,
            position,
            context.triggerCharacter
        );

        return {
            ...completionList,
            items: completionList.items.filter(item => item.kind !== vscode.CompletionItemKind.Text)
        };
    }
}

const createCompletionItem = (label: string | vscode.CompletionItemLabel, kind?: vscode.CompletionItemKind, sortText?: string): vscode.CompletionItem => {
    const completion = new vscode.CompletionItem(label, kind);
    completion.sortText = sortText;
    return completion;
}
