import * as vscode from 'vscode';
import { AstItemType, Field, FieldSegment, Replacement, StandardReplacement } from './parser/ast-models';
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

export const getMatchingStandardFields = (replacements: Replacement[], sourceField: Field) => 
    replacements
    .filter((other): other is StandardReplacement & { fieldSegment: FieldSegment & Required<Pick<FieldSegment, "field">> } =>
    other.type === AstItemType.replacement &&
    other.fieldSegment.field?.content === sourceField.content &&
    other.fieldSegment.field !== sourceField);
