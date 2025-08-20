import * as vscode from 'vscode';
import { ANKI_EDITOR_EMBEDDED_SCHEME, ANKI_EDITOR_INITIAL_SCHEME_BASE, ANKI_EDITOR_SCHEME_BASE } from '../../constants';
import { LanguageId, VirtualLanguageId } from '../../models/embedded-languages';

export const createVirtualUri = (languageId: LanguageId | VirtualLanguageId, fileExtension: string, originalUri: vscode.Uri) => 
    vscode.Uri.parse(`${ANKI_EDITOR_EMBEDDED_SCHEME}${languageId}${originalUri.path}.${fileExtension}`);

export const toInitialUri = (uri: vscode.Uri) =>
    uri.with({
        scheme: ANKI_EDITOR_INITIAL_SCHEME_BASE
    });

export const toAnkiEditorUri = (uri: vscode.Uri) =>
    uri.with({
        scheme: ANKI_EDITOR_SCHEME_BASE
    });
