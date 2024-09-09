/**
 * extracted from https://github.com/chenlijun99/autoanki/blob/main/packages/anki-connect/src/model.ts
 */

/**
 * Anki-connect: model related types.
 *
 * NOTE: models are also called "note types" in Anki.
 */
export type ModelId = number;
export type ModelName = string;
export type FieldName = string;
export type CardName = string;

export interface CardTemplate {
    Name?: CardName;
    Front: string;
    Back: string;
}

export interface NewModel {
    modelName: ModelName;
    inOrderFields: FieldName[];
    css: string;
    isCloze: boolean;
    cardTemplates: CardTemplate[];
}

export type ModelTemplates = Record<CardName, Omit<CardTemplate, 'Name'>>;

export interface UpdateModel {
    name: ModelName;
    templates: {
        [key in keyof ModelTemplates]: Partial<ModelTemplates[key]>;
    };
}

export type AnkiConnectActions = {
    /**
     * Gets the complete list of model names for the current user.
     */
    modelNames: {
        6: {
            request: void;
            response: ModelName[];
        };
    };
    /**
     * Gets the complete list of model names and their corresponding IDs for the current user
     */
    modelNamesAndIds: {
        6: {
            request: void;
            response: Record<ModelId, ModelName>;
        };
    };
    /**
     * Gets the complete list of field names for the provided model name.
     */
    modelFieldNames: {
        6: {
            request: {
                modelName: ModelName;
            };
            response: FieldName[];
        };
    };
    /**
     * Returns an object indicating the fields on the question and answer side
     * of each card template for the given model name. The question side is given
     * first in each array.
     */
    modelFieldsOnTemplates: {
        6: {
            request: {
                modelName: ModelName;
            };
            response: Record<CardName, FieldName[]>;
        };
    };
    /**
     * Creates a new model to be used in Anki. User must provide the modelName,
     * inOrderFields and cardTemplates to be used in the model. There are optinal
     * fields css and isCloze. If not specified, css will use the default Anki css
     * and isCloze will be equal to False. If isCloze is True then model will be
     * created as Cloze.
     *
     * Optionally the Name field can be provided for each entry of cardTemplates.
     * By default the card names will be Card 1, Card 2, and so on.
     */
    createModel: {
        6: {
            request: NewModel;
            // TODO
            response: unknown;
        };
    };

    /**
     * Returns an object indicating the template content for each card connected
     * to the provided model by name.
     */
    modelTemplates: {
        6: {
            request: {
                modelName: ModelName;
            };
            response: ModelTemplates;
        };
    };
    /**
     * Gets the CSS styling for the provided model by name.
     */
    modelStyling: {
        6: {
            request: {
                modelName: ModelName;
            };
            response: {
                css: string;
            };
        };
    };
    /**
     * Modify the templates of an existing model by name. Only specifies cards
     * and specified sides will be modified. If an existing card or side is not
     * included in the request, it will be left unchanged.
     */
    updateModelTemplates: {
        6: {
            request: {
                model: UpdateModel;
            };
            response: null;
        };
    };

    /**
     * Modify the CSS styling of an existing model by name.
     */
    updateModelStyling: {
        6: {
            request: {
                model: {
                    name: ModelName;
                    css: string;
                };
            };
            response: null;
        };
    };

    /**
     * Find and replace string in existing model by model name. Customise to
     * replace in front, back or css by setting to true/false.
     */
    findAndReplaceInModels: {
        6: {
            request: {
                model: {
                    modelName: ModelName;
                    findText: string;
                    replaceText: string;
                    front: boolean;
                    back: boolean;
                    css: boolean;
                };
            };
            response: number;
        };
    };

    /**
     * Retrieves the base64-encoded contents of the specified file,
     * returning false if the file does not exist.
     */
    getMediaFilesNames: {
        6: {
            request: {
                pattern: string;
            },
            response: string[]
        }
    }

    /**
     * Requests permission to use the API exposed by this plugin.
     */
    requestPermission: {
        6: {
            request: void,
            response: {
                permission: "granted",
                requireApiKey: boolean,
                version: 6
            } | {
                permission: "denied"
            }
        }
    }
};  

export type ActionNames = keyof AnkiConnectActions;
