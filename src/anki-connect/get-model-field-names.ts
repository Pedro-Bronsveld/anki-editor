import { ApiKey } from "../models/anki-connect/api-key";
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
