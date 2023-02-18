import * as vscode from 'vscode';
import { getLanguageService, LanguageService, TextDocument as HtmlLibTextDocument } from 'vscode-html-languageservice';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import VirtualDocumentProvider from '../virtual-documents-provider';

export default class TemplateDocumentChangeProvider extends LanguageFeatureProviderBase {

    private htmlLanguageService: LanguageService;
    
    constructor(protected virtualDocumentProvider: VirtualDocumentProvider) {
        super(virtualDocumentProvider);

        this.htmlLanguageService = getLanguageService();
    }
    async onDocumentChange(event: vscode.TextDocumentChangeEvent) {
        const { document } = event;     
        if (document.languageId !== TEMPLATE_LANGUAGE_ID || event.contentChanges.length === 0)
            return;

        const change = event.contentChanges[0];

        if (change.text !== ">")
            return;
        
        const position: vscode.Position = new vscode.Position(change.range.start.line, change.range.start.character + 1);
        
        const embeddedDocument = this.getEmbeddedByPosition(document, position);

        if (embeddedDocument.languageId !== "html")
            return;
        
        const transformedDocument: HtmlLibTextDocument = {
            ...document,
            uri: document.uri.toString()
        };

        const htmlDocument = this.htmlLanguageService.parseHTMLDocument(transformedDocument);
        
        const closeTagSnippet = this.htmlLanguageService.doTagComplete(transformedDocument, position, htmlDocument);

        if (closeTagSnippet === null)
            return null;

        await vscode.commands.executeCommand(
            "editor.action.insertSnippet",
            {
                snippet: closeTagSnippet
            }
        );
    }
    
}