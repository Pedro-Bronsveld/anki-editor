import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME } from '../constants';
import { escapeCardName, escapeText, unescapeCardName, unescapeText } from './escape-uri';

export const uriPathToParts = (uri: vscode.Uri): string[] => {
    const parts = uri.path.split("/").filter(part => part);

    if (parts[0] === "Note Types"){
        if (parts[1]) {
            // unescape note type name
            parts[1] = unescapeText(parts[1]);

            if (parts[2] && parts[3])
                // unescape card name
                parts[2] = unescapeCardName(parts[2]);
        }
    }

    return parts;
}

export const partsToUri = (parts: string[]): vscode.Uri => {
    const resultParts = [...parts];

    if (parts[0] === "Note Types") {
        if (parts[1])
            // escape note type name
            resultParts[1] = escapeText(parts[1])
            if (parts[2] && parts[3])
                // escape card name
                resultParts[2] = escapeCardName(parts[2]);
    }

    const path = resultParts.join("/");
    return vscode.Uri.parse(`${ANKI_EDITOR_SCHEME}${path}`);
}
