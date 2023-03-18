import { TextEncoder } from "util";
import * as vscode from "vscode";
import AnkiConnect from "../anki-connect/anki-connect";
import { TEMPLATE_EXTENSION } from "../constants";
import Directory from "../models/directory";
import { Entry } from "../models/entry";
import File from "../models/file";
import { escapeText, escapeCardName } from "./escape-uri";
import { uriPathToParts } from "./uri-parser";

export const lookupNoteType = async (uri: vscode.Uri, ankiConnect: AnkiConnect): Promise<Entry | undefined> => {
    const parts = uriPathToParts(uri).slice(1);

    if (parts.length === 0) {
        // Uri is root of note types folder, return list of note type directories
        console.log("fetching modelNames");
        const modelNames = await ankiConnect.getModelNames();

        const rootDir = new Directory("");
        modelNames
            .map(modelName => escapeText(modelName))
            .forEach(dirName => {
                rootDir.entries.set(dirName, new Directory(dirName));
            });

        return rootDir;
    }

    const [modelName, cardName, sideFileName] = parts;

    if (parts.length === 1) {
        // Uri is a note type model, return list of card directories and stylesheet file
        const modelTemplates = await ankiConnect.getModelTemplates(modelName);

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
        // Uri is a stylesheet
        if (cardName === "Styling.css")
            return await ankiConnect.getModelStyling(modelName, cardName);
        
        // Uri is a directory with card templates
        const cardTemplateDir = new Directory(cardName);
        (["Front", "Back"] as const)
            .map(side => `${side}${TEMPLATE_EXTENSION}`)
            .forEach(fileName => {
                cardTemplateDir.entries.set(fileName, new File(fileName));
            });

        return cardTemplateDir;
    }
    else if (parts.length === 3) {
        // Uri is card template html file
        const side = sideFileName.split(".")[0];

        if (side !== "Front" && side !== "Back")
            throw vscode.FileSystemError.FileNotFound(uri);

        const modelTemplates = await ankiConnect.getModelTemplates(modelName);
        const card = modelTemplates[cardName];
        if (!card)
            throw vscode.FileSystemError.FileNotFound(uri);

        const file = new File(sideFileName);
        file.data = new TextEncoder().encode(card[side]);

        return file;
    }

    throw vscode.FileSystemError.FileNotFound(uri);
}
