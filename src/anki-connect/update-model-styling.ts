import { invoke } from "./invoke";

export const updateModelStyling = async (modelName: string, css: string, origin?: string, key?: string): Promise<null> => {
    return await invoke({
            action: "updateModelStyling",
            version: 6,
            request: {
                model: {
                    name: modelName,
                    css
                }
            },
            origin,
            key
        });
}
