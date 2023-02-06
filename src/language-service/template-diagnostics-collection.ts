import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { getCSSLanguageService, TextDocument as CssTextDocument } from 'vscode-css-languageservice';
import VirtualDocumentProvider from './virtual-documents-provider';

export default class TemplateDiagnosticsProvider extends LanguageFeatureProviderBase {

    private cssLanguageService = getCSSLanguageService();

    constructor(virtualDocumentProvider: VirtualDocumentProvider) {
        super(virtualDocumentProvider);
    }
    
    async updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): Promise<void> {
        if (document.languageId !== "anki") {
            collection.clear();
            return;
        }

        const embeddedDocument = this.getEmbeddedByLanguage(document, "css");

        if (!embeddedDocument)
            return;

        const cssDocument = CssTextDocument.create(embeddedDocument.virtualUri.toString(), embeddedDocument.languageId, document.version, embeddedDocument.content);
        const stylesheet =this.cssLanguageService.parseStylesheet(cssDocument);
        const diagnostics = this.cssLanguageService.doValidation(cssDocument, stylesheet);

        collection.set(document.uri, diagnostics as unknown as vscode.Diagnostic[]);

        return;
    }
    
}