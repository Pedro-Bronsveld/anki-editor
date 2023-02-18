export enum AstItemType{
    none = 1,
    document = 2,
    replacement = 3,
    conditionalStart = 4,
    conditionalEnd = 5,
    filter = 6,
    field = 7,
    filterArgument = 8,
    filterArgumentKeyValue = 9,
    filterArgKey = 10,
    filterArgDivider = 11,
    filterArgValue = 12
}

export type AstItemBase = {
    content: string;
    start: number;
    end: number;
}

export type TemplateDocument = AstItemBase & {
    type: AstItemType.document,
    replacements: Replacement[];
}

export enum ReplacementType {
    standard = 1,
    conditionalStart = 1,
    conditionalEnd = 2
}

export type ReplacementBase = AstItemBase & {
    field: Field | null;
}

export type StandardReplacement = ReplacementBase & {
    type: AstItemType.replacement,
    replacementType: ReplacementType.standard;
    filters: Filter[];
}

export enum ConditionalType {
    filled = 1,
    empty = 2
}

export type ConditionalStart = ReplacementBase & {
    type: AstItemType.conditionalStart,
    replacementType: ReplacementType.conditionalStart;
    conditionalType: ConditionalType;
    endTag?: ConditionalEnd;
}

export type ConditionalEnd = ReplacementBase & {
    type: AstItemType.conditionalEnd,
    replacementType: ReplacementType.conditionalEnd;
    startTag?: ConditionalStart;
}

export type Replacement = StandardReplacement | ConditionalStart | ConditionalEnd;

export type Filter = AstItemBase & {
    type: AstItemType.filter,
    name: string,
    arguments: (FilterArgument | FilterArgumentKeyValue)[]
};

export type Field = AstItemBase & {
    type: AstItemType.field
};

export type FilterArgument = AstItemBase & {
    type: AstItemType.filterArgument,
};

export type FilterArgumentKeyValue = AstItemBase & {
    type: AstItemType.filterArgumentKeyValue,
    key: FilterArgKey,
    divider: FilterArgDivider,
    values: FilterArgValue[]
};

export type FilterArgKey = AstItemBase & {
    type: AstItemType.filterArgKey,
};

export type FilterArgDivider = AstItemBase & {
    type: AstItemType.filterArgDivider,
}

export type FilterArgValue = AstItemBase & {
    type: AstItemType.filterArgValue,
}

export type FilterArgPart = FilterArgKey | FilterArgDivider | FilterArgValue;
