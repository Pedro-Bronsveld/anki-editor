import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { uriPathToParts } from '../../note-types/uri-parser';
import { specialFields } from '../anki-builtin';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { DiagnosticCode } from '../diagnostic-codes';
import { documentRange } from '../document-util';
import { findSimilarStartEnd } from '../find-similar';
import { isBackSide } from '../template-util';
import VirtualDocumentProvider from '../virtual-documents-provider';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateCodeActionProvider extends LanguageFeatureProviderBase implements vscode.CodeActionProvider {

    constructor(virtualDocumentProvider: VirtualDocumentProvider, private ankiModelDataProvider: AnkiModelDataProvider) {
        super(virtualDocumentProvider);
    }
    
    async provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): Promise<(vscode.CodeAction | vscode.Command)[] | null | undefined> {

        const embeddedDocument = this.getEmbeddedByPosition(document, range.start);

        if (embeddedDocument.languageId !== TEMPLATE_LANGUAGE_ID)
            return [];
        
        const uriParts = uriPathToParts(document.uri);
        const modelName = document.uri.scheme === ANKI_EDITOR_SCHEME_BASE && uriParts.length >= 2 ? uriParts[1] : "";
        const fieldNames = (document.uri.scheme === ANKI_EDITOR_SCHEME_BASE ? await this.ankiModelDataProvider.getFieldNames(modelName) : [])
            .concat(specialFields)
        
        if (isBackSide(document))
            fieldNames.push("FrontSide");

        const actions: vscode.CodeAction[] = context.diagnostics
            .filter((diagnostic: vscode.Diagnostic | undefined): diagnostic is Exclude<vscode.Diagnostic, undefined> => typeof diagnostic?.code === "number")
            .flatMap(diagnostic => {

                switch(diagnostic.code) {
                    case DiagnosticCode.invalidCharacter:
                    case DiagnosticCode.invalidSpace:
                        {
                            const workspaceEdit = new vscode.WorkspaceEdit();
                            workspaceEdit.delete(document.uri, diagnostic.range);
                            return createCodeAction(`Remove invalid ${diagnostic.code === DiagnosticCode.invalidSpace ? "space" : "character"}`, workspaceEdit);
                        }
                    case DiagnosticCode.invalidField:
                        {
                            const invalidField = embeddedDocument.content.substring(document.offsetAt(diagnostic.range.start), document.offsetAt(diagnostic.range.end));
                            return findSimilarStartEnd(fieldNames, invalidField.toLowerCase(), false)
                                .map(fieldName => {
                                    const workspaceEdit = new vscode.WorkspaceEdit();
                                    workspaceEdit.replace(document.uri, diagnostic.range, fieldName);
                                    return createCodeAction(`Replace with '${fieldName}'`, workspaceEdit);
                                });
                        }
                    case DiagnosticCode.invalidTtsLanguageArg:
                        {
                            const diagnosticContent = embeddedDocument.content.substring(document.offsetAt(diagnostic.range.start), document.offsetAt(diagnostic.range.end));
                            const spaceMatch = diagnosticContent.match(/^[\s\r\n]*/);
                            const workspaceEdit = new vscode.WorkspaceEdit();
                            const start = document.offsetAt(diagnostic.range.start);
                            workspaceEdit.replace(document.uri, documentRange(document,
                                start, start + (spaceMatch?.[0].length ?? 0 )),
                                "en_US ");
                            return createCodeAction("Insert default language argument 'en_US'", workspaceEdit);
                        }
                        break;
                    default:
                        return;
                }
                
            })
            .filter(<T>(action: T): action is Exclude<T, undefined> => action !== undefined);
        
        return actions;

        // TODO: Forwarding for html, javascript and css code actions?

        // if (!embeddedDocument)
        //     return;

        // if (embeddedDocument.languageId !== TEMPLATE_LANGUAGE_ID) {
        //     const commands = await vscode.commands.executeCommand<vscode.Command[]>(
        //         'vscode.executeCodeActionProvider',
        //         embeddedDocument.virtualUri,
        //         range,
        //         context.only
        //     )
            
        //     return commands;
        // }
    }
}

const createCodeAction = (title: string, workspaceEdit: vscode.WorkspaceEdit, kind: vscode.CodeActionKind = vscode.CodeActionKind.QuickFix): vscode.CodeAction => {
    const action = new vscode.CodeAction(title, kind);
    action.edit = workspaceEdit;
    return action;
}
