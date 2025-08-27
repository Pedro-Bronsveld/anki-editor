import * as vscode from 'vscode';
import { LineChange } from "../models/vscode/scm/line-change";

export const resolveDocumentLineChange = (
        document: vscode.TextDocument,
        initialDocument: vscode.TextDocument,
        lineChange: LineChange
    ) => {
    const isInsertion = lineChange.originalEndLineNumber === 0;
    const isDeletion = lineChange.modifiedEndLineNumber === 0;
    
    // Determine zero-based start and end line indexes
    const modifiedStartLineIndex = lineChange.modifiedStartLineNumber - (isDeletion ? 0 : 1);
    const modifiedEndLineIndex = isDeletion
        ? modifiedStartLineIndex
        : lineChange.modifiedEndLineNumber;
    
    const originalStartLineIndex = lineChange.originalStartLineNumber - (isInsertion ? 0 : 1);
    const originalEndLineIndex = isInsertion
        ? originalStartLineIndex
        : lineChange.originalEndLineNumber;
    
    const isAtEndOfDocument = originalEndLineIndex === initialDocument.lineCount;
    
    // Resolve ranges and text
    const modifiedRange = new vscode.Range(
        isInsertion && isAtEndOfDocument
            ? document.lineAt(modifiedStartLineIndex-1).range.end
            : new vscode.Position(modifiedStartLineIndex, 0),
        new vscode.Position(modifiedEndLineIndex, 0)
    );
    const modifiedText = document.getText(modifiedRange);
    
    const originalRange = new vscode.Range(
        isDeletion && isAtEndOfDocument
            ? initialDocument.lineAt(originalStartLineIndex-1).range.end
            : new vscode.Position(originalStartLineIndex, 0),
        new vscode.Position(originalEndLineIndex, 0)
    );
    const originalText = initialDocument.getText(originalRange);
    
    return {
        modifiedRange,
        modifiedText,
        originalRange,
        originalText
    }
}
