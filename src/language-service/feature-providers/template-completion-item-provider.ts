import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { uriPathToParts } from '../../note-types/uri-parser';
import { builtinFilters, specialFields } from '../anki-builtin';
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
            if (replacement.fieldSegment !== null && inItem(replacement.fieldSegment, offset)) {
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
            
            if (replacement.type === AstItemType.replacement &&
                (replacement.filterSegments.length === 0 || getItemAtOffset(replacement.filterSegments, offset))) {
                // Create builtin filter suggestions
                // Filter suggestions are only shown when triggering completion items inside a filter segment, or when there are no filter segments in the replacement
                completionItemList.push(...builtinFilters.map(filterName => createCompletionItem(filterName, vscode.CompletionItemKind.Function, "4")));
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
