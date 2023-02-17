import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateHighlightsProvider extends LanguageFeatureProviderBase implements vscode.DocumentHighlightProvider {
    
    async provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.DocumentHighlight[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByLanguage(document, "html");
        
        if (!embeddedDocument)
            return;
        
        const highlights = await vscode.commands.executeCommand<vscode.DocumentHighlight[]>(
            'vscode.executeDocumentHighlights',
            embeddedDocument.virtualUri,
            position
        );
        
        return highlights;
    }

}