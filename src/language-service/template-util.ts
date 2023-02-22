import * as vscode from 'vscode';

export const isBackSide = (document: vscode.TextDocument): boolean =>
    document.uri.path.split("/").slice(-1)[0]?.toLowerCase().startsWith("back");
