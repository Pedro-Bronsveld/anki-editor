import * as vscode from 'vscode';
import { ANKI_EDITOR_EMBEDDED_SCHEME } from '../../constants';
import { LanguageId, VirtualLanguageId } from '../../models/embedded-languages';

export const createVirtualUri = (languageId: LanguageId | VirtualLanguageId, fileExtension: string, originalUri: vscode.Uri) => 
    vscode.Uri.parse(`${ANKI_EDITOR_EMBEDDED_SCHEME}${languageId}${originalUri.path}.${fileExtension}`);
