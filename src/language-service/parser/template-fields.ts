import { Field, TemplateDocument } from "./ast-models";

export const getFieldsInTemplate = (template: TemplateDocument, excludeRange?: { start: number, end: number }): Field[] =>
    template.replacements
    .map(replacement => replacement.fieldSegment.field)
    .filter((field): field is Exclude<typeof field, undefined> => field !== undefined)
    .filter(field => 
        excludeRange === undefined || field.end < excludeRange.start || field.start > excludeRange.end
    );
