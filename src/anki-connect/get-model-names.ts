import { invoke } from "@autoanki/anki-connect";
import * as vscode from "vscode";

export const getModelNames = async (): Promise<string[]> => {
    return await invoke({
            action: "modelNames",
            version: 6,
            request: undefined
        }).catch(err => {
            console.log(err);
            vscode.window.showErrorMessage("Anki-Connect can't be reached.");
            throw vscode.FileSystemError.Unavailable("Anki-Connect can't be reached.")
        });
}
