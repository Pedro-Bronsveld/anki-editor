import { AstItemBase, AstItemType, ConditionalType, Field, Filter, FilterArgument, FilterArgumentKeyValue, Replacement, ReplacementBase, ReplacementType, TemplateDocument } from "./ast-models";

export const parseTemplateDocument = (input: string): TemplateDocument => {
    
    const replacementMatches = getReplacementMatches(input);
    
    const replacements = replacementMatches.map(replacementMatch =>
        parseReplacement(replacementMatch[0], replacementMatch.index)
    );
    
    return {
        content: input,
        start: 0,
        end: input.length,
        type: AstItemType.document,
        replacements: replacements
    }
}

const replacementRegexp = /{{[^{}]*}}/g;

export const getReplacementMatches = (documentText: string) => [...documentText.matchAll(replacementRegexp)];

const parseReplacement = (replacementText: string, offset: number = 0): Replacement => {
    
    // Test if the replacement is a conditional replacement or a standard replacement
    const matchConditional = replacementText.match(/^{{[\s\r\n\t]*([#^/])/);
    
    const end = offset + replacementText.length;
    
    if (matchConditional) {
        // Parse as a conditional replacement
        const conditionalCharacter = matchConditional[1];

        const replacementType = conditionalCharacter === "/" ? ReplacementType.conditionalEnd : ReplacementType.conditionalStart;

        const field = parseField(replacementText.substring(matchConditional.length, replacementText.length - 2), offset + matchConditional.length);

        const replacement: ReplacementBase = {
            content: replacementText,
            start: offset,
            end,
            field
        }
        
        return replacementType === ReplacementType.conditionalStart
            ? {
                ...replacement,
                type: AstItemType.conditionalStart,
                field,
                replacementType,
                conditionalType: conditionalCharacter === "#" ? ConditionalType.filled : ConditionalType.empty
            } : {
                ...replacement,
                type: AstItemType.conditionalEnd,
                field,
                replacementType
            }
    }
    
    // Parse as a standard replacement

    const innerContent = replacementText.substring(2, replacementText.length - 2);
    const filterSegmentsMatches = [...innerContent.matchAll(/[^:]+(?=:)/g)];
    const fieldSegmentMatch = innerContent.match(/[^:]+(?=$)/);

    const filters = filterSegmentsMatches
        .map(match => parseFilter(match[0], offset + (match.index ?? 0) + 2))
        .filter(<T>(f: T): f is Exclude<T | null, null> => f !== null);

    const field: Field | null = fieldSegmentMatch 
        ? parseField(fieldSegmentMatch[0], offset + (fieldSegmentMatch.index ?? 0) + 2)
        : null;

    return {
        content: replacementText,
        type: AstItemType.replacement,
        start: offset,
        end,
        replacementType: ReplacementType.standard,
        field,
        filters
    }
};

const fieldRegexp = /[^#^/\s:{}\"]+([^:{}\s\"]|\s(?!\s*(}}|$)))*(?!.*:)/

const parseField = (input: string, offset: number = 0): Field | null => {
    const fieldMatch = input.match(fieldRegexp);

    if (!fieldMatch)
        return null;

    const start = offset + (fieldMatch.index ?? 0);
    const end = start + (fieldMatch.length ?? 0)

    return {
        content: fieldMatch[0],
        type: AstItemType.field,
        start,
        end
    };
};

const parseFilter = (input: string, offset: number = 0): Filter | null => {

    const filterPartsMatches = [...input.matchAll(/[^\s\r\n\t]+/g)];

    if (filterPartsMatches.length === 0)
        return null;
    
    const filterNameMatch = filterPartsMatches[0];
    const filterArgMatches = filterPartsMatches.slice(1);

    const filterArguments = filterArgMatches
        .map(match => parseFilterArgument(match[0]))
        .filter(<T>(f: T): f is Exclude<T | null, null> => f !== null)

    const filterStart = offset + (filterNameMatch.index ?? 0);;
    const filter: Filter = {
        content: input,
        name: filterNameMatch[0],
        type: AstItemType.filter,
        start: filterStart,
        end: filterStart + filterNameMatch[0].length,
        arguments: filterArguments
    }
    
    return filter;
}

const parseFilterArgument = (input: string, offset: number = 0): FilterArgument | FilterArgumentKeyValue | null => {

    const argumentMatch = input.match(/(?:([^=\s]+)(=)+)?([^\s\r\n\t=]*)/);

    if (!argumentMatch)
        return null;
    
    const start = offset + (argumentMatch.index ?? 0);
    const end = start + input.length;

    const key: string | undefined = argumentMatch[1];
    const divider: string | undefined = argumentMatch[2];
    const value: string | undefined = argumentMatch[3];

    return key !== undefined && divider !== undefined
        ? {
            content: input,
            type: AstItemType.filterArgumentKeyValue,
            start,
            end,
            key: {
                ...createAstItemBase(key, offset),
                type: AstItemType.filterArgKey
            },
            divider: {
                ...createAstItemBase(divider, offset + key.length),
                type: AstItemType.filterArgDivider
            },
            values: typeof value === "string"
                ? [...value.matchAll(/[^,]+/g)].map(match => ({
                    ...createAstItemBase(match[0], offset + key.length + divider.length + (match.index ?? 0)),
                    type: AstItemType.filterArgValue
                }))
                : []
        }
        : {
            content: value,
            type: AstItemType.filterArgument,
            start,
            end
        };
    
}

const createAstItemBase = (content: string, offset: number = 0): AstItemBase => ({
    content,
    start: offset,
    end: content.length + offset
});
