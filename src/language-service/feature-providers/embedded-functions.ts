import * as vscode from 'vscode';
import { ANKI_EDITOR_EMBEDDED_SCHEME } from '../../constants';

export const createVirtualUri = (languageId: string, fileExtension: string, originalUri: vscode.Uri) => 
    vscode.Uri.parse(`${ANKI_EDITOR_EMBEDDED_SCHEME}${languageId}${originalUri.path}.${fileExtension}`);
