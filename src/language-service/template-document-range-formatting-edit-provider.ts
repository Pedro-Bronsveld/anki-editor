import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateDocumentRangeFormattingEditProvider extends LanguageFeatureProviderBase implements vscode.DocumentRangeFormattingEditProvider {

    async provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken): Promise<vscode.TextEdit[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByLanguage(document, "html");

        if (!embeddedDocument)
            return;
        
        const textEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
            'vscode.executeFormatRangeProvider',
            embeddedDocument.virtualUri,
            range,
            options
        );

        return textEdits;
    }

}