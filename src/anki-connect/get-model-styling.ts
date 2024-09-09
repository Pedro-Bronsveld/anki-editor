import { ApiKey } from "../models/anki-connect/api-key";
import File from "../models/file";
import { wrappedInvoke } from "./wrapper-invoke";

export const getModelStyling = async (modelName: string, cardName: string, origin?: string, key?: ApiKey) =>
    await wrappedInvoke({
        action: "modelStyling",
        version: 6,
        request: {
            modelName
        },
        origin,
        key
    }).then(styling => {
        const file = new File(cardName);
        file.data = new TextEncoder().encode(styling.css);
        return file;
    })
