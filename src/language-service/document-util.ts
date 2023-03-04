import * as vscode from 'vscode';

export const documentRange = (document: vscode.TextDocument, start: number, end: number) =>
    new vscode.Range(document.positionAt(start), document.positionAt(end));
