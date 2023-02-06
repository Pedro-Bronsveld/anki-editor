import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateRenameProvider extends LanguageFeatureProviderBase implements vscode.RenameProvider {
    
    async provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): Promise<vscode.WorkspaceEdit | null | undefined> {
        const embeddedDocument = super.getEmbeddedByLanguage(document, "html");

        if (!embeddedDocument)
            return undefined;

        const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
            'vscode.executeDocumentRenameProvider',
            embeddedDocument.virtualUri,
            position,
            newName
        );
        
        edit.entries().forEach(([uri, textEdits]) => {
            edit.set(document.uri, textEdits);
        });

        return edit;
    }

    async prepareRename(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Range | { range: vscode.Range; placeholder: string; } | null | undefined> {
        
        const embeddedDocument = super.getEmbeddedByLanguage(document, "html");

        if (!embeddedDocument)
            return undefined;

        // For some reason we have to open the document before executing the
        // vscode.prepareRename or vscode.executeDocumentRenameProvider commands, 
        // otherwise it throws an "Unexpected type" error.
        const openedDocument = await vscode.workspace.openTextDocument(embeddedDocument.virtualUri);
        
        const res = await vscode.commands.executeCommand<vscode.Range>(
            'vscode.prepareRename',
            embeddedDocument.virtualUri,
            position
        );

        return res;

    }
    
}