import * as vscode from 'vscode';

export type EmbeddedDocument = {
    languageId: string,
    content: string,
    virtualUri: vscode.Uri
}
