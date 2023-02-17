import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateSymbolProvider extends LanguageFeatureProviderBase implements vscode.DocumentSymbolProvider {
    
    async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByLanguage(document, "html");
        console.log("symbols");
        if (!embeddedDocument)
            return;
        
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            embeddedDocument.virtualUri
        );
        
        const flattenedSymbols = this.flattenSymbols(symbols);

        return flattenedSymbols;
    }

    private flattenSymbols(documentSymbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
        return documentSymbols.flatMap(docSymbol => [docSymbol, ...this.flattenSymbols(docSymbol.children)]);
    }

}