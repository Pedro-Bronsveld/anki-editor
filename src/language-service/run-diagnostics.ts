import TemplateDiagnosticsProvider from "./feature-providers/template-diagnostics-collection";
import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from "../constants";

/**
 * Update diagnostics for all open Anki template documents.
 * @param diagnosticsProvider 
 */
export const updateAllDiagnostics = (diagnosticsProvider: TemplateDiagnosticsProvider, visibleOnly: boolean = false) => {
    (visibleOnly
        ? vscode.window.visibleTextEditors.map(textEditor => textEditor.document)
        : vscode.workspace.textDocuments)    
            .filter(document => document.languageId === TEMPLATE_LANGUAGE_ID)
            .forEach(document => diagnosticsProvider.updateDiagnostics(document));
}
