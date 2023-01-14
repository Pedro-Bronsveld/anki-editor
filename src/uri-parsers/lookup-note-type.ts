import { invoke } from "@autoanki/anki-connect";
import { TextEncoder } from "util";
import * as vscode from "vscode";
import Directory from "../models/directory";
import { Entry } from "../models/entry";
import File from "../models/file";

export const lookupNoteType = async (uri: vscode.Uri): Promise<Entry | undefined> => {
    const parts = uri.path.split("/").filter(part => part).slice(1);

    if (parts.length === 0) {
        // Root, return list of note types directories
        console.log("fetching modelNames");

        const modelNames = await invoke({
            action: "modelNames",
            version: 6,
            request: undefined
        }).catch(err => {
            console.log(err);
            // throw new Error(err);
            vscode.window.showErrorMessage("Anki-Connect can't be reached.");
            throw vscode.FileSystemError.Unavailable("Anki-Connect can't be reached.")
        })

        const rootDir = new Directory("");
        modelNames.forEach(modelName => {
            rootDir.entries.set(modelName, new Directory(modelName));
        });

        return rootDir;

    }
    else if (parts.length === 1) {
        // Note type model, return list of card directories and stylesheet file
        const modelName = parts[0];
        const modelTemplates = await invoke({
            action: "modelTemplates",
            version: 6,
            request: {
                modelName
            }
        }).catch(err => {
            console.log(err);
            throw new Error(err);
        });

        const noteTypeDir = new Directory(modelName);
        Object.keys(modelTemplates).forEach(cardName => {
            noteTypeDir.entries.set(cardName, new Directory(cardName));
        });
        noteTypeDir.entries.set("Styling.css", new File("Styling.css"));

        return noteTypeDir;
    }
    else if (parts.length === 2) {
        //  Style sheet file
        const modelName = parts[0];
        const part = parts[1];

        // File is stylesheet
        if (part === "Styling.css") {
            return await invoke({
                action: "modelStyling",
                version: 6,
                request: {
                    modelName
                }
            }).then(styling => {
                const file = new File(part);
                file.data = new TextEncoder().encode(styling.css);
                return file;
            }).catch(err => {
                console.log(err);
                throw new Error(err);
            })
        }
        
        // Directory with card templates
        const cardName = part;
        const cardTemplateDir = new Directory(cardName);
        ["Front", "Back"].forEach(side => {
            const fileName = `${side}.html`;
            cardTemplateDir.entries.set(fileName, new File(fileName));
        });

        return cardTemplateDir;
    }
    else if (parts.length === 3) {
        // Card template file
        const modelName = parts[0];
        const cardName = parts[1];
        const sideFileName = parts[2];
        const side = sideFileName.split(".")[0];

        if (side !== "Front" && side !== "Back")
            throw vscode.FileSystemError.FileNotFound(uri);

        const modelTemplates = await invoke({
            action: "modelTemplates",
            version: 6,
            request: {
                modelName
            }
        }).catch(err => {
            console.log(err);
            throw new Error(err);
        });

        const card = modelTemplates[cardName];
        if (!card)
            throw vscode.FileSystemError.FileNotFound(uri);

        const file = new File(sideFileName);
        file.data = new TextEncoder().encode(card[side]);

        return file;
    }

    throw vscode.FileSystemError.FileNotFound(uri);
}
