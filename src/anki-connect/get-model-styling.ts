import { invoke } from "@autoanki/anki-connect";
import { TextEncoder } from "util";
import File from "../models/file";

export const getModelStyling = async (modelName: string, cardName: string, origin?: string) => {
    return await invoke({
        action: "modelStyling",
        version: 6,
        request: {
            modelName
        },
        origin
    }).then(styling => {
        const file = new File(cardName);
        file.data = new TextEncoder().encode(styling.css);
        return file;
    }).catch(err => {
        console.log(err);
        throw new Error(err);
    })
}