import { invoke } from "@autoanki/anki-connect";
import { Side } from "../models/template";

export const updateModelTemplates = async (modelName: string, cardName: string, side: Side, html: string, origin?: string): Promise<null> => {
    return await invoke({
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
        origin
    });
}
