import * as vscode from 'vscode';

export type UriPair = {
    docUri: vscode.Uri,
    initialUri: vscode.Uri
}

export type ChangedUriPair = UriPair & {
    hasChanges: boolean;
}
