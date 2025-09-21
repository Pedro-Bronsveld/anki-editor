import * as vscode from 'vscode';
import { stripUri } from './feature-providers/virtual-uris';

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
        const strippedUri = stripUri(uri);
        return this.documents.get(strippedUri.toString());
    }

    setDocumentContent(uri: vscode.Uri, document: string, overwriteExisting=true) {
        const strippedUri = stripUri(uri);
        const strippedUriString = strippedUri.toString();
        const uriString = uri.toString();
        if (!overwriteExisting && this.documents.has(strippedUriString))
            return;
        const existingDocument = this.documents.get(strippedUriString);
        this.documents.set(strippedUriString, document);
        if (document !== existingDocument) {
            this.onDidChangeEmitter.fire(strippedUri);
            if (strippedUriString !== uriString)
                this.onDidChangeEmitter.fire(uri);
        }
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
