import { ApiKey } from "@autoanki/anki-connect";
import { Side } from "../models/template";
import { wrappedInvoke } from "./wrapper-invoke";

export const updateModelTemplates = async (modelName: string, cardName: string, side: Side, html: string, origin?: string, key?: ApiKey): Promise<null> =>
    await wrappedInvoke({
        action: "updateModelTemplates",
        version: 6,
        request: {
            model: {
                name: modelName,
                templates: {
                    [cardName]: {
                        [side]: html
                    }
                }
            }
        },
        origin,
        key
    });
