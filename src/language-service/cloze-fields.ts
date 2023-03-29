import { AstItemType, Replacement, TemplateDocument } from "./parser/ast-models";

const clozeFieldRegex = /^c(0*[1-9]\d*)$/;

export type ClozeField = {
    num: number;
    name: string;
};

export const isClozeField = (field: string): boolean =>
    clozeFieldRegex.test(field);

export const isClozeReplacement = (replacement: Replacement): boolean =>
    replacement.fieldSegment.field !== undefined &&
    (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) 
    && isClozeField(replacement.fieldSegment.field.content);

export const getClozeFieldNumber = (field: string) =>
    Number(field.match(clozeFieldRegex)?.[1] ?? 0);

export const getClozeFieldSuggestions = (templateDocument: TemplateDocument): ClozeField[] => {
    const clozeFields = [...new Set(templateDocument.replacements
        .filter(replacement => isClozeReplacement(replacement))
        .map(replacement => replacement.fieldSegment.field)
        .filter((field): field is Exclude<typeof field, undefined> => field !== undefined)
        .map(({ content }) => content))]
        .map<ClozeField>(content => ({ num: getClozeFieldNumber(content), name: content }))
        .sort(({ num: numA }, { num: numB }) => numA - numB);

    const maxConsecutiveNum = [...clozeFields].reduce((previousNum, { num: currentNum }) => currentNum === previousNum + 1 ? currentNum : previousNum, 0);

    clozeFields.splice(maxConsecutiveNum + 1, 0, { num: maxConsecutiveNum + 1, name: `c${maxConsecutiveNum + 1}` });
    
    return clozeFields;
}
