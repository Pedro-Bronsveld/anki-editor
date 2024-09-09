import { ModelTemplates } from "../models/anki-connect/actions";
import { ApiKey } from "../models/anki-connect/api-key";
import { wrappedInvoke } from "./wrapper-invoke";

export const getModelTemplates = async (modelName: string, origin?: string, key?: ApiKey): Promise<ModelTemplates> =>
    await wrappedInvoke({
        action: "modelTemplates",
        version: 6,
        request: {
            modelName
        },
        origin,
        key
    });
