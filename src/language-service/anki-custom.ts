import * as vscode from 'vscode';
import { ANKI_EDITOR_CONFIG } from '../constants';
import { BuiltIn, BuiltInFilter, builtinFiltersList, builtinFiltersNames, publicBuiltinFiltersList, publicBuiltinFiltersNames, specialFieldsList, specialFieldsNames, toMap } from './anki-builtin';

export type CustomFilter = {
    name: string;
    fieldRequired?: boolean;
}

const getItemsFromConfig = (section: "customFieldNames" | "customFilterNames"): (string | object)[] => {
    const possibleCustomFieldNames = vscode.workspace.getConfiguration(ANKI_EDITOR_CONFIG).get(section);

    return (possibleCustomFieldNames instanceof Array ? possibleCustomFieldNames : [])
        .filter((possibleItem): possibleItem is string | object => typeof possibleItem === "string" || typeof possibleItem === "object");
}

export const getCustomFieldNames = (): string[] => getItemsFromConfig("customFieldNames")
    .filter((possibleFieldName): possibleFieldName is string => typeof possibleFieldName === "string")
    .filter(customFieldName => customFieldName.match(/^[^#^/\s:{}\"]+([^:{}\s\"]|\s(?!\s*(}}|$)))*$/));

export const getCustomFilterItems = (): CustomFilter[] => getItemsFromConfig("customFilterNames")
    .filter((possibleFilter): possibleFilter is string | CustomFilter => typeof possibleFilter === "string" || typeof possibleFilter === "object" && "name" in possibleFilter && typeof possibleFilter.name === "string")
    .map<CustomFilter>(customFilter => {
        if (typeof customFilter === "object")
            return {
                name: customFilter.name,
                fieldRequired: customFilter.fieldRequired ?? true
            }
        
        return {
            name: customFilter,
            fieldRequired: true
        }
    })
    .filter(customFilter => customFilter.name.match(/^[^#^/\s:{}"]+$/));

export const getCustomFilterNames = () => getCustomFilterItems()
    .map(({ name }) => name);

export const getCustomFieldsList = () => getCustomFieldNames().map<BuiltIn>(fieldName => ({
    name: fieldName,
    description: "Custom field defined in anki-editor extension settings."
}));

export const getCustomFiltersList = () => getCustomFilterItems().map<BuiltInFilter>(customFilter => ({
    name: customFilter.name,
    description: "Custom filter defined in anki-editor extension settings.",
    fieldRequired: customFilter.fieldRequired ?? true
}));

export const getExtendedSpecialFieldsList = () => specialFieldsList.concat(getCustomFieldsList());
export const getExtendedFiltersList = (publicOnly = false) => (publicOnly
        ? publicBuiltinFiltersList
        : builtinFiltersList)
    .concat(getCustomFiltersList());

export const getExtendedSpecialFields = () => toMap(getExtendedSpecialFieldsList());
export const getExtendedFilters = (publicOnly = false) => toMap(getExtendedFiltersList(publicOnly));

export const getExtendedSpecialFieldNames = () => specialFieldsNames.concat(getCustomFieldNames());
export const getExtendedFilterNames = (publicOnly = false) => (publicOnly
        ? publicBuiltinFiltersNames
        : builtinFiltersNames)
    .concat(getCustomFilterNames());
