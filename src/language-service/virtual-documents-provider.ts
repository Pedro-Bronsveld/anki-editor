import * as vscode from 'vscode';

export default class VirtualDocumentProvider implements vscode.TextDocumentContentProvider {
    private documents = new Map<string, string>();

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        return this.documents.get(uri.toString());
    }

    setDocumentContent(uri: vscode.Uri, document: string) {
        this.documents.set(uri.toString(), document);
    }

    clear() {
        this.documents.clear();
    };
    
}
