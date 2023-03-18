import * as vscode from 'vscode';
import { ANKI_EDITOR_CONFIG } from '../constants';
import { BuiltIn, builtinFiltersList, builtinFiltersNames, specialFieldsList, specialFieldsNames, toMap } from './anki-builtin';

const getItemsFromConfig = (section: "customFieldNames" | "customFilterNames"): string[] => {
    const possibleCustomFieldNames = vscode.workspace.getConfiguration(ANKI_EDITOR_CONFIG).get(section);

    return (possibleCustomFieldNames instanceof Array ? possibleCustomFieldNames : [])
        .filter((possibleFieldName): possibleFieldName is string => typeof possibleFieldName === "string");
}

export const getCustomFieldNames = () => getItemsFromConfig("customFieldNames")
    .filter(customFielName => customFielName.match(/^[^#^/\s:{}\"]+([^:{}\s\"]|\s(?!\s*(}}|$)))*$/));

export const getCustomFilterNames = () => getItemsFromConfig("customFilterNames")
    .filter(customFilterName => customFilterName.match(/^[^#^/\s:{}"]+$/));

export const getCustomFieldsList = () => getCustomFieldNames().map<BuiltIn>(fieldName => ({
    name: fieldName,
    description: "Custom field defined in anki-editor extension settings."
}));

export const getCustomFiltersList = () => getCustomFilterNames().map<BuiltIn>(filterName => ({
    name: filterName,
    description: "Custom field defined in anki-editor extension settings."
}));

export const getExtendedSpecialFieldsList = () => specialFieldsList.concat(getCustomFieldsList());
export const getExtendedFiltersList = () => builtinFiltersList.concat(getCustomFiltersList());

export const getExtendedSpecialFields = () => toMap(getExtendedSpecialFieldsList());
export const getExtendedFilters = () => toMap(getExtendedFiltersList());

export const getExtendedSpecialFieldNames = () => specialFieldsNames.concat(getCustomFieldNames());
export const getExtendedFilterNames = () => builtinFiltersNames.concat(getCustomFilterNames());
