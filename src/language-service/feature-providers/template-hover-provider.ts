import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateHoverProvider extends LanguageFeatureProviderBase implements vscode.HoverProvider {

    async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null | undefined> {
        const embeddedDocument = this.getEmbeddedByPosition(document, position);

        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID)
            return;

        console.log("hover");

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            embeddedDocument.virtualUri,
            position,
        )

        return {
            contents: hovers.length > 0 ? hovers[0].contents : []
        };
    }
}
