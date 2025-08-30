import * as vscode from 'vscode';

export default class VirtualDocumentProvider implements vscode.TextDocumentContentProvider {
    private documents = new Map<string, string>();

    get uriEntries() {
        return [...this.documents.entries()]
            .map<[vscode.Uri, string]>(([uriString, document]) => [vscode.Uri.parse(uriString), document]);
    }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        return this.documents.get(uri.toString());
    }

    setDocumentContent(uri: vscode.Uri, document: string, overwriteExisting=true) {
        const uriString = uri.toString();
        if (!overwriteExisting && this.documents.has(uriString))
            return;
        this.documents.set(uriString, document);
    }

    clear() {
        this.documents.clear();
    };

    deleteUri(uri: vscode.Uri) {
        this.documents.delete(uri.toString());
    }

    has(uri: vscode.Uri) {
        return this.documents.has(uri.toString());
    }

    get(uri: vscode.Uri) {
        return this.documents.get(uri.toString());
    }
    
}
