import { invoke } from "@autoanki/anki-connect";

export const updateModelStyling = async (modelName: string, css: string, origin?: string): Promise<null> => {
    return await invoke({
            action: "updateModelStyling",
            version: 6,
            request: {
                model: {
                    name: modelName,
                    css
                }
            },
            origin
        });
}
