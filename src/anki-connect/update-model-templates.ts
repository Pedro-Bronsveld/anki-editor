import { invoke } from "@autoanki/anki-connect";
import { ModelTemplates } from "@autoanki/anki-connect/dist/model";

export const updateModelTemplates = async (modelName: string, cardName: string, side: "Front" | "Back", html: string): Promise<void> => {
    return await invoke({
        action: "updateModelTemplates",
        version: 6,
        request: {
            model: {
                name: modelName,
                templates: {
                    [cardName]: {
                        [side]: html
                    }
                } as ModelTemplates
            }
        }
    }).then(result => {
        console.log(result);
        return Promise.resolve();
    }).catch(err => {
        console.log(err);
        return Promise.reject(err);
    });
}
