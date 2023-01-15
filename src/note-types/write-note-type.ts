import { invoke } from "@autoanki/anki-connect";
import { ModelTemplates } from "@autoanki/anki-connect/dist/model";
import { TextDecoder } from "util";
import * as vscode from "vscode";
import { updateModelStyling } from "../anki-connect/update-model-styling";
import { updateModelTemplates } from "../anki-connect/update-model-templates";
import { decodeEscape } from "./escape-uri";

export const writeNoteType = (uri: vscode.Uri, content: Uint8Array): Promise<void> => {

    const parts = uri.path.split("/").filter(part => part).slice(1);

    if (parts.length === 0)
            throw vscode.FileSystemError.FileNotFound(`Writing to ${uri} is not supported by this extension.`);
        
        const modelName = decodeEscape(parts[0]);
        const decodedContent = new TextDecoder().decode(content);

        if (parts.length === 2 && parts[1] === "Styling.css") {
            // save style
            return updateModelStyling(modelName, decodedContent);
        }
        else if (parts.length === 3 && parts[2].endsWith(".html")) {
            // save template
            const cardName = decodeEscape(parts[1]);
            const side = parts[2].split(".")[0];

            if (side !== "Front" && side !== "Back")
                throw vscode.FileSystemError.FileNotFound(uri);
            
            return updateModelTemplates(modelName, cardName, side, decodedContent);
        }
        
        throw vscode.FileSystemError.FileNotFound(`Writing to ${uri} is not supported by this extension.`);

}