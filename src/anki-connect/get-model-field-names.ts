import { ApiKey } from "@autoanki/anki-connect";
import { wrappedInvoke } from "./wrapper-invoke";

export const getModelFieldNames = async (modelName: string, origin?: string, key?: ApiKey): Promise<string[]> =>
    await wrappedInvoke({
        action: "modelFieldNames",
        version: 6,
        request: {
            modelName
        },
        origin,
        key
    });
