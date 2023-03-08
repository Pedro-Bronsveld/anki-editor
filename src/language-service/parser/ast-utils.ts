import { AstItemBase, Filter, FilterSegment } from './ast-models';
import { AstItemType, ConditionalEnd, ConditionalStart, ConditionalType, Field, FieldSegment, Replacement, StandardReplacement } from './ast-models';

export const inItem = (item: AstItemBase, offset: number) =>
    offset >= item.start &&
    offset <= item.end

export const getItemAtOffset = <T extends AstItemBase>(items: T[], offset: number): T | undefined =>
    items.find(item => inItem(item, offset))

export const getFieldAtOffset = (replacements: Replacement[], offset: number): Field | undefined => {
    const replacement = getItemAtOffset(replacements, offset);

    if (!replacement?.fieldSegment.field || !inItem(replacement.fieldSegment.field, offset))
        return undefined;
    
    return replacement.fieldSegment.field;
}

export const getConditionalAtOffset = (replacements: Replacement[], offset: number): ConditionalStart | ConditionalEnd | undefined =>
    replacements.find((replacement): replacement is ConditionalStart | ConditionalEnd => 
    (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) &&
    inItem(replacement, offset));

export const getMatchingStandardFields = (replacements: Replacement[], sourceField: Field) => 
    replacements
    .filter((other): other is StandardReplacement & { fieldSegment: FieldSegment & Required<Pick<FieldSegment, "field">> } =>
    other.type === AstItemType.replacement &&
    other.fieldSegment.field?.content === sourceField.content &&
    other.fieldSegment.field !== sourceField);

export const getFiltersByName = (replacements: Replacement[], name: string): Filter[] =>
    replacements
    .filter((replacement): replacement is StandardReplacement => replacement.type === AstItemType.replacement)
    .flatMap(replacement => replacement.filterSegments)
    .filter((filterSegment): filterSegment is FilterSegment & Required<Pick<FilterSegment, "filter">> =>
        filterSegment.filter !== undefined && filterSegment.filter.content === name)
    .map(filterSegment => filterSegment.filter);

export const getParentConditionals = (replacement: Replacement): ConditionalStart[] => {
    
        const parentConditionals = replacement.parentConditional ? getParentConditionals(replacement.parentConditional) : [];
    
        if (replacement.type === AstItemType.conditionalStart)
            parentConditionals.push(replacement);
    
        return parentConditionals;
    }

export const getUnavailableFieldNames = (replacement: Replacement): Set<string> => {
    const parentConditionals = replacement.parentConditional ? getParentConditionals(replacement.parentConditional) : [];
    const unavailableFieldNames = replacement.type !== AstItemType.replacement
        ? new Set(parentConditionals
            .filter((conditional): conditional is ConditionalStart & { fieldSegment: FieldSegment & Required<Pick<FieldSegment, "field">> } =>
            conditional.fieldSegment.field !== undefined)
            .map(conditional => conditional.fieldSegment.field.content)) 
        : new Set(parentConditionals
            .filter((conditional): conditional is ConditionalStart & { conditionalType: ConditionalType.empty , fieldSegment: FieldSegment & Required<Pick<FieldSegment, "field">> } =>
            conditional.conditionalType === ConditionalType.empty &&
            conditional.fieldSegment.field !== undefined)
            .map(conditional => conditional.fieldSegment.field.content));
    return unavailableFieldNames;
}

export const conditionalChar = (conditional: ConditionalStart | ConditionalEnd) =>
    conditional.type === AstItemType.conditionalStart
        ? conditionalStartChar(conditional.conditionalType)
        : "/";

export const conditionalStartChar = (conditionalType: ConditionalType) => conditionalType === ConditionalType.filled ? "#" : "^";
