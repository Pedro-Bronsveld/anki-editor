import { ApiKey } from "@autoanki/anki-connect";
import { wrappedInvoke } from "./wrapper-invoke";

export const updateModelStyling = async (modelName: string, css: string, origin?: string, key?: ApiKey): Promise<null> =>
    await wrappedInvoke({
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
