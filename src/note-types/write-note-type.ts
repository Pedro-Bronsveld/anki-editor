import { TextDecoder } from "util";
import * as vscode from "vscode";
import { updateModelStyling } from "../anki-connect/update-model-styling";
import { updateModelTemplates } from "../anki-connect/update-model-templates";
import { TEMPLATE_EXTENSION } from "../constants";
import { uriPathToParts } from "./uri-parser";

export const writeNoteType = (uri: vscode.Uri, content: Uint8Array): Promise<void> => {

    const parts = uriPathToParts(uri).slice(1);
    if (parts.length === 0)
        throw vscode.FileSystemError.FileNotFound(`Writing to ${uri} is not supported by this extension.`);
        
    const [modelName, cardName, sideFileName] = parts;
    const decodedContent = new TextDecoder().decode(content);

    if (parts.length === 2 && cardName === "Styling.css")
        // save style
        return updateModelStyling(modelName, decodedContent);
    else if (parts.length === 3 && sideFileName.endsWith(`${TEMPLATE_EXTENSION}`)) {
        // save template
        const side = sideFileName.split(".")[0];

        if (side !== "Front" && side !== "Back")
            throw vscode.FileSystemError.FileNotFound(uri);
        
        return updateModelTemplates(modelName, cardName, side, decodedContent);
    }
        
    throw vscode.FileSystemError.FileNotFound(`Writing to ${uri} is not supported by this extension.`);
}