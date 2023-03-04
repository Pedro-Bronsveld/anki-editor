export enum AstItemType{
    none = 1,
    document = 2,
    replacement = 3,
    conditionalStart = 4,
    conditionalEnd = 5,
    filterSegment = 6,
    fieldSegment = 7,
    filter = 8,
    field = 9,
    filterArgument = 10,
    filterArgumentKeyValue = 11,
    filterArgKey = 12,
    filterArgDivider = 13,
    filterArgValue = 14
}

export type AstItemBase = {
    content: string;
    start: number;
    end: number;
}

export type TemplateDocument = AstItemBase & {
    type: AstItemType.document;
    replacements: Replacement[];
}

export type ReplacementBase = AstItemBase & {
    parentConditional?: ConditionalStart;
}

export type StandardReplacement = ReplacementBase & {
    type: AstItemType.replacement;
    filterSegments: FilterSegment[];
    fieldSegment: FieldSegment;
}

export enum ConditionalType {
    filled = 1,
    empty = 2
}

export type ConditionalStart = ReplacementBase & {
    type: AstItemType.conditionalStart;
    conditionalType: ConditionalType;
    endTag?: ConditionalEnd;
    fieldSegment: FieldSegment;
    childReplacements: Replacement[];
}

export type ConditionalEnd = ReplacementBase & {
    type: AstItemType.conditionalEnd;
    startTag?: ConditionalStart;
    fieldSegment: FieldSegment;
}

export type Replacement = StandardReplacement | ConditionalStart | ConditionalEnd;

export type FilterSegment = AstItemBase & {
    type: AstItemType.filterSegment;
    filter?: Filter;
}

export type FieldSegment = AstItemBase & {
    type: AstItemType.fieldSegment;
    field?: Field;
}

export type Filter = AstItemBase & {
    type: AstItemType.filter;
    arguments: (FilterArgument | FilterArgumentKeyValue)[];
};

export type Field = AstItemBase & {
    type: AstItemType.field;
};

export type FilterArgument = AstItemBase & {
    type: AstItemType.filterArgument;
};

export type FilterArgumentKeyValue = AstItemBase & {
    type: AstItemType.filterArgumentKeyValue;
    key: FilterArgKey;
    divider: FilterArgDivider;
    values: FilterArgValue[];
};

export type FilterArgKey = AstItemBase & {
    type: AstItemType.filterArgKey;
};

export type FilterArgDivider = AstItemBase & {
    type: AstItemType.filterArgDivider;
}

export type FilterArgValue = AstItemBase & {
    type: AstItemType.filterArgValue;
}

export type FilterArgPart = FilterArgKey | FilterArgDivider | FilterArgValue;
