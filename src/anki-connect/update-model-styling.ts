import { invoke } from "@autoanki/anki-connect";

export const updateModelStyling = async (modelName: string, css: string): Promise<void> => {
    return await invoke({
            action: "updateModelStyling",
            version: 6,
            request: {
                model: {
                    name: modelName,
                    css
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
