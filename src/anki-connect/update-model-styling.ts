import { ApiKey, invoke } from "@autoanki/anki-connect";

export const updateModelStyling = async (modelName: string, css: string, origin?: string, key?: ApiKey): Promise<null> =>
    await invoke({
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
