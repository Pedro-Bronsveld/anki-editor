import * as vscode from 'vscode';
import { getEmbbeddedDocument } from './embedded-document';
import VirtualDocumentProvider from './virtual-documents-provider';

export default class TemplateHoverProvider implements vscode.HoverProvider {

    constructor(private virtualDocumentProvider: VirtualDocumentProvider) {}
    
    async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null | undefined> {
        const embeddedDocument = getEmbbeddedDocument(document, position);
        this.virtualDocumentProvider.setDocumentContent(embeddedDocument.virtualUri, embeddedDocument.content);

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
