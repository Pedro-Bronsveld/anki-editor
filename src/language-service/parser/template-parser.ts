import { AstItemBase, AstItemType, ConditionalStart, ConditionalType, Field, FieldSegment, Filter, FilterArgDivider, FilterArgKey, FilterArgument, FilterArgumentKeyValue, FilterArgValue, FilterSegment, Replacement, ReplacementBase, TemplateDocument } from "./ast-models";

export const parseTemplateDocument = (input: string): TemplateDocument => {
    
    const replacementMatches = getReplacementMatches(input);
    
    const replacements = replacementMatches.map(replacementMatch =>
        parseReplacement(replacementMatch[0], replacementMatch.index)
    );

    // link conditional opening and closing tags
    linkConditionalTags(replacements);
    
    return {
        content: input,
        start: 0,
        end: input.length,
        type: AstItemType.document,
        replacements
    }
}

const replacementRegexp = /{{(?:[^}]|}(?!}))*}}/g;

export const getReplacementMatches = (documentText: string) => [...documentText.matchAll(replacementRegexp)];

const parseReplacement = (replacementText: string, offset: number = 0): Replacement => {
    
    // Test if the replacement is a conditional replacement or a standard replacement
    const matchConditional = replacementText.match(/^{{[\s\r\n\t]*([#^/])/);
    
    const end = offset + replacementText.length;
    
    if (matchConditional) {
        // Parse as a conditional replacement
        const conditionalCharacter = matchConditional[1];
        
        // Field segment contains all text after the conidtional character, and before the 2 closing curly braces
        const fieldSegmentOffset = matchConditional[0].length;
        const fieldSegmentContent = replacementText.substring(fieldSegmentOffset, replacementText.length - 2);

        const fieldSegment = createFieldSegment(fieldSegmentContent, offset + fieldSegmentOffset)

        const replacementBase: ReplacementBase = {
            content: replacementText,
            start: offset,
            end
        }
        
        return conditionalCharacter !== "/"
            ? {
                ...replacementBase,
                type: AstItemType.conditionalStart,
                fieldSegment,
                conditionalType: conditionalCharacter === "#" ? ConditionalType.filled : ConditionalType.empty,
                childReplacements: []
            } : {
                ...replacementBase,
                type: AstItemType.conditionalEnd,
                fieldSegment
            }
    }
    
    // Parse as a standard replacement
    const innerContent = replacementText.substring(2, replacementText.length - 2);
    const filterSegmentsMatches = [...innerContent.matchAll(/[^:]*(?=:)/g)];
    const fieldSegmentMatch = innerContent.match(/[^:]*(?=$)/);

    const filterSegments = filterSegmentsMatches
        .map(match => createFilterSegment(match[0], offset + (match.index ?? 0) + 2));

    const fieldSegment = createFieldSegment(fieldSegmentMatch?.[0] ?? "", offset + (fieldSegmentMatch?.index ?? 0) + 2);

    return {
        content: replacementText,
        type: AstItemType.replacement,
        start: offset,
        end,
        fieldSegment,
        filterSegments
    }
};

const linkConditionalTags = (replacements: Replacement[]): Replacement[] => {
    
    const nestedStartTags: ConditionalStart[] = [];
    for (const replacement of replacements) {

        if (nestedStartTags.length > 0) {
            replacement.parentConditional = nestedStartTags[0];
            nestedStartTags[0].childReplacements.push(replacement);
        }
        
        if (replacement.type === AstItemType.replacement)
            continue;

        if (replacement.type === AstItemType.conditionalStart) {
            if (replacement.fieldSegment.field)
                nestedStartTags.unshift(replacement);
        }
        else if (replacement.type === AstItemType.conditionalEnd) {

            const startIndex = nestedStartTags
                .findIndex(conditionalStart => conditionalStart.fieldSegment.field?.content === replacement.fieldSegment.field?.content);

            if (startIndex === -1)
                continue;
            
            const startTag = nestedStartTags[startIndex];
            startTag.endTag = replacement;
            replacement.startTag = startTag;

            nestedStartTags.splice(0, startIndex);
        }

    }
    
    return replacements;
}

const fieldRegexp = /[^#^/\s:{}\"]+([^:{}\s\"]|\s(?!\s*(}}|$)))*(?!.*:)/

const parseField = (input: string, offset: number = 0): Field | undefined => {
    const fieldMatch = input.match(fieldRegexp);

    if (!fieldMatch)
        return undefined;

    const start = offset + (fieldMatch.index ?? 0);
    const end = start + (fieldMatch[0].length ?? 0);

    return {
        content: fieldMatch[0],
        type: AstItemType.field,
        start,
        end
    };
};

const parseFilter = (input: string, offset: number = 0): Filter | undefined => {    
    const filterPartsMatches = [...input.matchAll(/[^\s\r\n\t]+/g)];

    if (filterPartsMatches.length === 0)
        return undefined;
    
    const filterNameMatch = filterPartsMatches[0];
    const filterArgMatches = filterPartsMatches.slice(1);

    const filterArguments = filterArgMatches
        .map(match => parseFilterArgument(match[0], offset + (match.index ?? 0)))
        .filter(<T>(f: T): f is Exclude<T | null, null> => f !== null)

    const filterStart = offset + (filterNameMatch.index ?? 0);
    const filter: Filter = {
        content: filterNameMatch[0],
        type: AstItemType.filter,
        start: filterStart,
        end: filterStart + filterNameMatch[0].length,
        arguments: filterArguments
    }
    
    return filter;
}

const parseFilterArgument = (input: string, offset: number = 0): FilterArgument | FilterArgumentKeyValue | null => {

    const argumentMatch = input.match(/(?:([^=\s]+)(=+))?([^\s\r\n\t=]*)/);

    if (!argumentMatch)
        return null;
    
    const key: string | undefined = argumentMatch[1];
    const divider: string | undefined = argumentMatch[2];
    const value: string | undefined = argumentMatch[3];

    const res = key !== undefined && divider !== undefined
        ? createFilterArgumentKeyValue(input, key, divider, value, offset)
        : createFilterArgument(value, offset);
    return res;
}

const createAstItemBase = (content: string, offset: number = 0): AstItemBase => ({
    content,
    start: offset,
    end: content.length + offset
});

const createFilterSegment = (content: string, offset: number = 0): FilterSegment => ({
    ...createAstItemBase(content, offset),
    type: AstItemType.filterSegment,
    filter: parseFilter(content, offset)
});

const createFieldSegment = (content: string, offset: number = 0): FieldSegment => ({
    ...createAstItemBase(content, offset),
    type: AstItemType.fieldSegment,
    field: parseField(content, offset)
});

const createFilterArgumentKeyValue = (
    content: string,
    key: string,
    divider: string,
    value?: string,
    offset: number = 0,
    ): FilterArgumentKeyValue => ({
        ...createAstItemBase(content, offset),
        type: AstItemType.filterArgumentKeyValue,
        key: createFilterArgKey(key, offset),
        divider: createFilterArgDivider(divider, offset + key.length),
        values: value
            ? [...value.matchAll(/[^,]+/g)].map(match => 
                createFilterArgValue(match[0], offset + key.length + divider.length + (match.index ?? 0)))
            : []
    });

const createFilterArgument = (content: string, offset: number = 0): FilterArgument => ({
    ...createAstItemBase(content, offset),
    type: AstItemType.filterArgument,
});

const createFilterArgKey = (content: string, offset: number = 0): FilterArgKey => ({
    ...createAstItemBase(content, offset),
    type: AstItemType.filterArgKey,
});

const createFilterArgDivider = (content: string, offset: number = 0): FilterArgDivider => ({
    ...createAstItemBase(content, offset),
    type: AstItemType.filterArgDivider,
});

const createFilterArgValue = (content: string, offset: number = 0): FilterArgValue => ({
    ...createAstItemBase(content, offset),
    type: AstItemType.filterArgValue,
});
