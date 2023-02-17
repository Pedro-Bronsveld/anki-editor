import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateReferenceProvider extends LanguageFeatureProviderBase implements vscode.ReferenceProvider {

    async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): Promise<vscode.Location[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByPosition(document, position);        

        const locations = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeReferenceProvider',
            embeddedDocument.virtualUri,
            position,
        )
        
        return locations;
    }
}