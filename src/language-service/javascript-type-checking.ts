import * as vscode from 'vscode';
import { ANKI_EDITOR_CONFIG } from '../constants';

export const getCheckJsLevelSetting = (): boolean | undefined => {
    const checkJsSetting = vscode.workspace.getConfiguration(ANKI_EDITOR_CONFIG).get("checkJsLevel");
    if (typeof checkJsSetting === "string") {
        switch (checkJsSetting) {
            case "strict":
                return true;
            case "off":
                return false;
            default:
                return undefined;
        }
    }
    return undefined;
}
