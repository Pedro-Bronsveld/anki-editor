import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateDocumentFormattingEditProvider extends LanguageFeatureProviderBase implements vscode.DocumentFormattingEditProvider {

    async provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Promise<vscode.TextEdit[] | null | undefined> {
        
        const embeddedDocument = this.getEmbeddedByLanguage(document, "html");

        if (!embeddedDocument)
            return;
        
        const textEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
            'vscode.executeFormatDocumentProvider',
            embeddedDocument.virtualUri,
            options
        );

        return textEdits;
    }

}