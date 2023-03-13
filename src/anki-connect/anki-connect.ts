import { createCachedFunction } from "../utility/cached-function";
import { getModelFieldNames } from "./get-model-field-names";
import { getModelNames } from "./get-model-names";
import { getModelStyling } from "./get-model-styling";
import { getModelTemplates } from "./get-model-templates";
import { updateModelStyling } from "./update-model-styling";
import { updateModelTemplates } from "./update-model-templates";

export class AnkiConnect {

    public getModelNames = createCachedFunction(getModelNames);
    public getModelFieldNames = createCachedFunction(getModelFieldNames);
    public getModelTemplates = createCachedFunction(getModelTemplates);
    public getModelStyling = createCachedFunction(getModelStyling);
    public updateModelTemplates = updateModelTemplates;
    public updateModelStyling = updateModelStyling;

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
