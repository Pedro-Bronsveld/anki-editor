import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { uriPathToParts } from '../../note-types/uri-parser';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { parseTemplateDocument } from '../parser/template-parser';
import VirtualDocumentProvider from '../virtual-documents-provider';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateCompletionItemProvider extends LanguageFeatureProviderBase implements vscode.CompletionItemProvider {
    
    constructor(virtualDocumentProvider: VirtualDocumentProvider, private ankiModeldataProvider: AnkiModelDataProvider) {
        super(virtualDocumentProvider);
    }
    
    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {        
        const embeddedDocument = this.getEmbeddedByPosition(document, position);

        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {

            const templateDocument = parseTemplateDocument(embeddedDocument.content);
            
            // Anki template completion items handling
            if (document.uri.scheme !== ANKI_EDITOR_SCHEME_BASE)
                return undefined;
            
            const uriParts = uriPathToParts(document.uri);

            if (uriParts.length < 2)
                return undefined;
            
            const modelName = uriParts[1];
            
            const fieldNames = await this.ankiModeldataProvider.getFieldNames(modelName);

            const completionItemList: vscode.CompletionItem[] = fieldNames.map(fieldName => 
                new vscode.CompletionItem(fieldName, vscode.CompletionItemKind.Field)
            );

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