import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateSignatureHelpProvider extends LanguageFeatureProviderBase implements vscode.SignatureHelpProvider {

    async provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): Promise<vscode.SignatureHelp | null | undefined> {
        const embeddedDocument = super.getEmbedded(document, position);

        return await vscode.commands.executeCommand<vscode.SignatureHelp>(
            'vscode.executeSignatureHelpProvider',
            embeddedDocument.virtualUri,
            position,
            context.triggerCharacter
        );
    }

}