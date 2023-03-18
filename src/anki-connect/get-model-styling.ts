import { TextEncoder } from "util";
import File from "../models/file";
import { invoke } from "./invoke";

export const getModelStyling = async (modelName: string, cardName: string, origin?: string, key?: string) => {
    return await invoke({
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
}