import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { getCSSLanguageService } from 'vscode-css-languageservice';

export default class TemplateDiagnosticsProvider extends LanguageFeatureProviderBase {

    async updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): Promise<void> {
        const embeddedDocument = super.getEmbeddedByLanguage(document, "css");
        
        // const cssLanguageService = getCSSLanguageService();
        
        // cssLanguageService.doValidation(document, );

        return;
    }
    
}