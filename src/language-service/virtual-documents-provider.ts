import * as vscode from 'vscode';

export default class VirtualDocumentProvider implements vscode.TextDocumentContentProvider {

    private documents = new Map<string, string>();
    
    private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    public get onDidChange() : vscode.Event<vscode.Uri> {
        return this.onDidChangeEmitter.event;
    }    

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
        const currentDocument = this.documents.get(uriString);
        this.documents.set(uriString, document);
        if (document !== currentDocument)
            this.onDidChangeEmitter.fire(uri);
    }

    clear() {
        const clearedUris = this.uriEntries.map(([uri]) => uri);
        this.documents.clear();
        for (const clearedUri of clearedUris) {
            this.onDidChangeEmitter.fire(clearedUri);
        }
    };

    deleteUri(uri: vscode.Uri) {
        const removed = this.documents.delete(uri.toString());
        if (removed)
            this.onDidChangeEmitter.fire(uri);
    }

    has(uri: vscode.Uri) {
        return this.documents.has(uri.toString());
    }

    get(uri: vscode.Uri) {
        return this.documents.get(uri.toString());
    }
    
}
