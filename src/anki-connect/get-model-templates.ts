import { ApiKey } from "@autoanki/anki-connect";
import { ModelTemplates } from "@autoanki/anki-connect/dist/model";
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
