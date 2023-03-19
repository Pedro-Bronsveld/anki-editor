import * as vscode from 'vscode';
import { createCachedFunction } from "../cache/cached-function";
import { ANKI_EDITOR_CONFIG } from '../constants';
import { Side } from '../models/template';
import { getModelFieldNames } from "./get-model-field-names";
import { getModelNames } from "./get-model-names";
import { getModelStyling } from "./get-model-styling";
import { getModelTemplates } from "./get-model-templates";
import { updateModelStyling } from "./update-model-styling";
import { updateModelTemplates } from "./update-model-templates";

export default class AnkiConnect {

    private get origin(): string {
        const origin = vscode.workspace.getConfiguration(ANKI_EDITOR_CONFIG).get("origin");

        if (typeof origin !== "string")
            throw Error("Anki-Connect origin setting not set.");
        
        return origin;
    }

    private get apiKey(): string | undefined {
        const origin = vscode.workspace.getConfiguration(ANKI_EDITOR_CONFIG).get("apiKey");

        if (typeof origin !== "string")
            return undefined
        
        return origin;
    }

    public getModelNames = createCachedFunction(() =>
        getModelNames(this.origin, this.apiKey));
        
    public getModelFieldNames = createCachedFunction((modelName: string) =>
        getModelFieldNames(modelName, this.origin, this.apiKey));

    public getModelTemplates = createCachedFunction((modelName: string) =>
        getModelTemplates(modelName, this.origin, this.apiKey));

    public getModelStyling = createCachedFunction((modelName: string, cardName: string) =>
        getModelStyling(modelName, cardName, this.origin, this.apiKey));

    public updateModelTemplates = (modelName: string, cardName: string, side: Side, html: string) => {
        this.clearCacheForModel(modelName);
        return updateModelTemplates(modelName, cardName, side, html, this.origin, this.apiKey);
    }

    public updateModelStyling = (modelName: string, css: string) => {
        this.clearCacheForModel(modelName);
        return updateModelStyling(modelName, css, this.origin, this.apiKey);
    }

    // Cache clearing

    private cachedFunctions = [
        this.getModelNames,
        this.getModelFieldNames,
        this.getModelTemplates,
        this.getModelStyling
    ] as const;
        
    public clearCache() {
        this.cachedFunctions.forEach(func => func.clearCache());
    }

    public clearCacheForModel(modelName: string) {
        this.cachedFunctions.forEach(func => func.clearCacheWhere(({ args: [cachedModelName] }) => cachedModelName === modelName ))
    }

}
