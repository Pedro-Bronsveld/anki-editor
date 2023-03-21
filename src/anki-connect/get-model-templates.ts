import { invoke } from "@autoanki/anki-connect";
import { ModelTemplates } from "@autoanki/anki-connect/dist/model";

export const getModelTemplates = async (modelName: string, origin?: string, key?: string): Promise<ModelTemplates> =>
    await invoke({
        action: "modelTemplates",
        version: 6,
        request: {
            modelName
        },
        origin,
        key
    });
