import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateCodeActionProvider extends LanguageFeatureProviderBase implements vscode.CodeActionProvider {
    
    async provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): Promise<(vscode.CodeAction | vscode.Command)[] | null | undefined> {

        const embeddedDocument = this.getEmbeddedByLanguage(document, "html");

        if (!embeddedDocument)
            return;

        const commands = await vscode.commands.executeCommand<vscode.Command[]>(
            'vscode.executeCodeActionProvider',
            embeddedDocument.virtualUri,
            range
        )
        
        return commands;
    }

}