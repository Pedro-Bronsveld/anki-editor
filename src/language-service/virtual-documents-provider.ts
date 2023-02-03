import * as vscode from 'vscode';

export default class VirtualDocumentProvider implements vscode.TextDocumentContentProvider {
    private documents = new Map<string, string>();

    constructor() {}
    
    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        const doc = this.documents.get(uri.toString());
        return doc;
    }

    setDocumentContent(uri: vscode.Uri, document: string) {
        this.documents.set(uri.toString(), document);
    }

    clear() {
        this.documents.clear();
    };

}
