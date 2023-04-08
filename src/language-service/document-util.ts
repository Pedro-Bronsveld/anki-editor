import * as vscode from 'vscode';
import { AstItemBase } from './parser/ast-models';

export const documentRange = (document: vscode.TextDocument, start: number, end: number) =>
    new vscode.Range(document.positionAt(start), document.positionAt(end));

export const isMultiLineAstItem = (document: vscode.TextDocument, item: AstItemBase, minLines: number = 1): boolean => {
    const range = documentRange(document, item.start, item.end);
    return range.end.line - range.start.line >= minLines;
}
