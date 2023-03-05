import * as vscode from 'vscode';
import { Field, Replacement } from './parser/ast-models';
import { inItem } from './parser/ast-utils';

export const documentRange = (document: vscode.TextDocument, start: number, end: number) =>
    new vscode.Range(document.positionAt(start), document.positionAt(end));

export const getFieldAtOffset = (replacements: Replacement[], offset: number): Field | undefined => {
    const replacement = getReplacementAtOffset(replacements, offset);

    if (!replacement?.fieldSegment.field || !inItem(replacement.fieldSegment.field, offset))
        return undefined;
    
    return replacement.fieldSegment.field;
}

export const getReplacementAtOffset = (replacements: Replacement[], offset: number): Replacement | undefined =>
    replacements.find(replacement => inItem(replacement, offset));
