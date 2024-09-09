import { ApiKey } from "../models/anki-connect/api-key";
import { wrappedInvoke } from "./wrapper-invoke";

export const updateModelStyling = async (modelName: string, css: string, origin?: string, key?: ApiKey): Promise<null> =>
    await wrappedInvoke({
        action: "updateModelStyling",
        request: {
            model: {
                name: modelName,
                css
            }
        },
        origin,
        key
    });
