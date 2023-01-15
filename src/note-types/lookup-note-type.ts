import { invoke } from "@autoanki/anki-connect";
import { TextEncoder } from "util";
import * as vscode from "vscode";
import { getModelNames } from "../anki-connect/get-model-names";
import { getModelStyling } from "../anki-connect/get-model-styling";
import { getModelTemplates } from "../anki-connect/get-model-templates";
import Directory from "../models/directory";
import { Entry } from "../models/entry";
import File from "../models/file";
import { unescapeText, escapeText, escapeCardName, unescapeCardName } from "./escape-uri";

export const lookupNoteType = async (uri: vscode.Uri): Promise<Entry | undefined> => {
    const parts = uri.path.split("/").filter(part => part).slice(1);

    if (parts.length === 0) {
        // Root, return list of note types directories
        console.log("fetching modelNames");
        const modelNames = await getModelNames();

        const rootDir = new Directory("");
        modelNames
            .map(modelName => escapeText(modelName))
            .forEach(dirName => {
                rootDir.entries.set(dirName, new Directory(dirName));
            });

        return rootDir;

    }
    else if (parts.length === 1) {
        // Note type model, return list of card directories and stylesheet file
        const modelName = unescapeText(parts[0]);
        const modelTemplates = await getModelTemplates(modelName);

        const noteTypeDir = new Directory(modelName);
        Object.keys(modelTemplates)
            .map(cardName => escapeCardName(cardName))
            .forEach(dirName => {
                noteTypeDir.entries.set(dirName, new Directory(dirName));
            });
        noteTypeDir.entries.set("Styling.css", new File("Styling.css"));

        return noteTypeDir;
    }
    else if (parts.length === 2) {
        //  Style sheet file
        const modelName = unescapeText(parts[0]);
        const part = parts[1];

        // File is stylesheet
        if (part === "Styling.css")
            return await getModelStyling(modelName, part);
        
        // Directory with card templates
        const cardName = unescapeCardName(part);
        const cardTemplateDir = new Directory(cardName);
        ["Front", "Back"].forEach(side => {
            const fileName = `${side}.html`;
            cardTemplateDir.entries.set(fileName, new File(fileName));
        });

        return cardTemplateDir;
    }
    else if (parts.length === 3) {
        // Card template file
        const modelName = unescapeText(parts[0]);
        const cardName = unescapeCardName(parts[1]);
        const sideFileName = parts[2];
        const side = sideFileName.split(".")[0];

        const test = cardName.endsWith("\xAD");

        if (side !== "Front" && side !== "Back")
            throw vscode.FileSystemError.FileNotFound(uri);

        const modelTemplates = await getModelTemplates(modelName);

        const card = modelTemplates[cardName];
        if (!card)
            throw vscode.FileSystemError.FileNotFound(uri);

        const file = new File(sideFileName);
        file.data = new TextEncoder().encode(card[side]);

        return file;
    }

    throw vscode.FileSystemError.FileNotFound(uri);
}
