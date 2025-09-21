import * as vscode from 'vscode';
import { ANKI_EDITOR_EMBEDDED_SCHEME, ANKI_EDITOR_INITIAL_SCHEME_BASE, ANKI_EDITOR_SCHEME_BASE } from '../../constants';
import { LanguageId, VirtualLanguageId } from '../../models/embedded-languages';

export const createVirtualUri = (languageId: LanguageId | VirtualLanguageId, fileExtension: string, originalUri: vscode.Uri) => 
    vscode.Uri.parse(`${ANKI_EDITOR_EMBEDDED_SCHEME}${languageId}${originalUri.path}.${fileExtension}`);

/**
 * Replaces the scheme of the given uri with 'anki-editor-initial'
 * @param uri 
 * @returns a new uri object with modified scheme
 */
export const toInitialUri = (uri: vscode.Uri) =>
    uri.with({
        scheme: ANKI_EDITOR_INITIAL_SCHEME_BASE
    });

/**
 * Replaces the scheme of the given uri with 'anki-editor'
 * @param uri 
 * @returns a new uri object with modified scheme
 */
export const toAnkiEditorUri = (uri: vscode.Uri) =>
    uri.with({
        scheme: ANKI_EDITOR_SCHEME_BASE
    });

/**
 * Strip query and fragment from uri.
 * @param uri 
 * @returns stripped uri
 */
export const stripUri = (uri: vscode.Uri) =>
    uri.with({
        query: "",
        fragment: ""
    });

/**
 * Add a query parameter 't' to a uri, with the current timestamp in milliseconds.
 * Used in some places to force retrieval of the latest version of a document.
 * @param uri 
 * @returns uri with timestamp as query parameter
 */
export const timestampUri = (uri: vscode.Uri) =>
    uri.with({
        query: `t=${Date.now()}`
    });

/**
 * Add an id query parameter to a given uri.
 * Used in some places to force retrieval of the latest version of a document and
 * circumvent a bug when toggling source control.
 * @param uri 
 * @param id 
 * @returns uri with 'uriId' query parameter with the given id value
 */
export const addUriId = (uri: vscode.Uri, id: string) =>
    uri.with({
        query: `uriId=${id}`
    });

/**
 * Checks if the given uri contains any query params or a fragment.
 * @param uri 
 * @returns true if no query parameters and framgent, false otherwise
 */
export const isStrippedUri = (uri: vscode.Uri) =>
    uri.query === "" && uri.fragment === "";
