import { ApiKey } from '@autoanki/anki-connect';
import * as vscode from 'vscode';
import { createCachedFunction } from "../cache/cached-function";
import { ANKI_EDITOR_CONFIG } from '../constants';
import { Side } from '../models/template';
import { getModelFieldNames } from "./get-model-field-names";
import { getModelNames } from "./get-model-names";
import { getModelStyling } from "./get-model-styling";
import { getModelTemplates } from "./get-model-templates";
import { requestPermission } from './request-permission';
import { updateModelStyling } from "./update-model-styling";
import { updateModelTemplates } from "./update-model-templates";

export default class AnkiConnect {

    private get origin(): string {
        const origin = vscode.workspace.getConfiguration(ANKI_EDITOR_CONFIG).get("origin");

        if (typeof origin !== "string")
            throw Error("Anki-Connect origin setting not set.");
        
        return origin;
    }

    private get apiKey(): Exclude<ApiKey, null> | undefined {
        const key = vscode.workspace.getConfiguration(ANKI_EDITOR_CONFIG).get<ApiKey>("apiKey");

        if (key === null)
            return undefined;
        
        return key;
    }

    private async getApiKey(): Promise<Exclude<ApiKey, null> | undefined> {

        const permissionResult = await this.requestPermission();

        if (permissionResult.requireApikey === false)
            // Don't return api key if not required for requests.
            return undefined;
            
        return this.apiKey;
    }

    public requestPermission = createCachedFunction(async () => {
        const permissionResult = await requestPermission(this.origin);

        if (permissionResult.permission === "denied")
            vscode.window.showErrorMessage("Permission to access Anki-Connect api from this origin was denied.\n" +
                "Trust this origin in the pop-up in Anki.");

        return permissionResult;
    });

    public getModelNames = createCachedFunction(async () =>
        getModelNames(this.origin, await this.getApiKey()));
        
    public getModelFieldNames = createCachedFunction(async (modelName: string) =>
        getModelFieldNames(modelName, this.origin, await this.getApiKey()));

    public getModelTemplates = createCachedFunction(async (modelName: string) =>
        getModelTemplates(modelName, this.origin, await this.getApiKey()));

    public getModelStyling = createCachedFunction(async (modelName: string, cardName: string) =>
        getModelStyling(modelName, cardName, this.origin, await this.getApiKey()));

    public updateModelTemplates = async (modelName: string, cardName: string, side: Side, html: string) => {
        this.clearCacheForModel(modelName);
        return updateModelTemplates(modelName, cardName, side, html, this.origin, await this.getApiKey());
    }

    public updateModelStyling = async (modelName: string, css: string) => {
        this.clearCacheForModel(modelName);
        return updateModelStyling(modelName, css, this.origin, await this.getApiKey());
    }

    // Cache clearing

    private cachedFunctions = [
        this.requestPermission,
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
