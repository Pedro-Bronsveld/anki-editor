import { invoke } from "@autoanki/anki-connect";
import { ModelTemplates } from "@autoanki/anki-connect/dist/model";

export const getModelTemplates = async (modelName: string, origin?: string): Promise<ModelTemplates> => {
    return await invoke({
        action: "modelTemplates",
        version: 6,
        request: {
            modelName
        },
        origin
    });
}
