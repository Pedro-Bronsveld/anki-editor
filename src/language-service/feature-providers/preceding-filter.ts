import { BuiltInFilter } from "../anki-builtin";
import { FilterSegment } from "../parser/ast-models";

export const missingRequiredPrecedingFilter = (builtInFilter: BuiltInFilter, precedingFilterSegments: FilterSegment[]): boolean => {
    if (!builtInFilter.requiredPrecedingFilter)
        return false;
    
    if (typeof builtInFilter.requiredPrecedingFilter === "string" && precedingFilterSegments.length === 0)
        return true;
    
    const precedingFilterSegment = precedingFilterSegments[precedingFilterSegments.length-1];
    
    return precedingFilterSegment.filter?.content !== builtInFilter.requiredPrecedingFilter;
}
