import { invoke } from "@autoanki/anki-connect";
import { ModelTemplates } from "@autoanki/anki-connect/dist/model";

export const getModelTemplates = async (modelName: string): Promise<ModelTemplates> => {
    return await invoke({
        action: "modelTemplates",
        version: 6,
        request: {
            modelName
        }
    }).catch(err => {
        console.log(err);
        throw new Error(err);
    });
}
