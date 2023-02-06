import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { getCSSLanguageService, TextDocument as CssTextDocument } from 'vscode-css-languageservice';

export default class TemplateDiagnosticsProvider extends LanguageFeatureProviderBase {

    async updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): Promise<void> {
        if (document.languageId !== "anki") {
            collection.clear();
            return;
        }
        
        const embeddedDocument = super.getEmbeddedByLanguage(document, "css");

        if (!embeddedDocument)
            return;
        
        const cssLanguageService = getCSSLanguageService();

        const cssDocument = await vscode.workspace.openTextDocument(embeddedDocument.virtualUri);
        const stylesheet = cssLanguageService.parseStylesheet(cssDocument as unknown as CssTextDocument);
        const diagnostics = cssLanguageService.doValidation(cssDocument as unknown as CssTextDocument, stylesheet);

        collection.set(document.uri, diagnostics as unknown as vscode.Diagnostic[]);

        return;
    }
    
}