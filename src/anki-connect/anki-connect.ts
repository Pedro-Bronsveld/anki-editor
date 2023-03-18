import * as vscode from 'vscode';
import { createCachedFunction } from "../cache/cached-function";
import { Side } from '../models/template';
import { getModelFieldNames } from "./get-model-field-names";
import { getModelNames } from "./get-model-names";
import { getModelStyling } from "./get-model-styling";
import { getModelTemplates } from "./get-model-templates";
import { updateModelStyling } from "./update-model-styling";
import { updateModelTemplates } from "./update-model-templates";

export default class AnkiConnect {

    private get origin(): string {
        const origin = vscode.workspace.getConfiguration("anki-editor").get("origin");

        if (typeof origin !== "string")
            throw Error("Anki-Connect origin setting not set.");
        
        return origin;
    }

    public getModelNames = createCachedFunction(() =>
        getModelNames(this.origin));
        
    public getModelFieldNames = createCachedFunction((modelName: string) =>
        getModelFieldNames(modelName, this.origin));

    public getModelTemplates = createCachedFunction((modelName: string) =>
        getModelTemplates(modelName, this.origin));

    public getModelStyling = createCachedFunction((modelName: string, cardName: string) =>
        getModelStyling(modelName, cardName, this.origin));

    public updateModelTemplates = (modelName: string, cardName: string, side: Side, html: string) =>
        updateModelTemplates(modelName, cardName, side, html, this.origin);

    public updateModelStyling = (modelName: string, css: string) =>
        updateModelStyling(modelName, css, this.origin);

    public clearCache() {
        [
            this.getModelNames,
            this.getModelFieldNames,
            this.getModelTemplates,
            this.getModelStyling
        ]
        .forEach(func => func.clearCache());
    }

}
