import { ModelTemplates } from "@autoanki/anki-connect/dist/model";
import { invoke } from "./invoke";

export const getModelTemplates = async (modelName: string, origin?: string, key?: string): Promise<ModelTemplates> => {
    return await invoke({
        action: "modelTemplates",
        version: 6,
        request: {
            modelName
        },
        origin,
        key
    });
}
