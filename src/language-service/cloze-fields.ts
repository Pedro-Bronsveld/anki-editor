import { AstItemType, Replacement } from "./parser/ast-models";

const clozeFieldRegex = /^c0*[1-9]\d*$/;

export const isClozeField = (field: string): boolean =>
    clozeFieldRegex.test(field);

export const isClozeReplacement = (replacement: Replacement): boolean =>
    replacement.fieldSegment.field !== undefined &&
    (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) 
    && isClozeField(replacement.fieldSegment.field.content);
