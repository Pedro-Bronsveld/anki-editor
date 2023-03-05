import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { uriPathToParts } from '../../note-types/uri-parser';
import { specialFields, ttsKeyValueArgs } from '../anki-builtin';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { DiagnosticCode } from '../diagnostic-codes';
import { documentRange, getConditionalAtOffset } from '../document-util';
import { findSimilarStartEnd } from '../find-similar';
import { parseTemplateDocument } from '../parser/template-parser';
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
            .concat(specialFields);
        
        const isBackside = isBackSide(document);

        const actions: vscode.CodeAction[] = context.diagnostics
            .filter((diagnostic: vscode.Diagnostic | undefined): diagnostic is Exclude<vscode.Diagnostic, undefined> => typeof diagnostic?.code === "number")
            .flatMap(diagnostic => {

                const diagnosticContent = getDiagnosticContent(document, embeddedDocument.content, diagnostic);

                switch(diagnostic.code) {
                    case DiagnosticCode.invalidSpace:
                    case DiagnosticCode.invalidCharacter:
                    case DiagnosticCode.invalidTtsOptionValue:
                        return createRemovalCodeAction(document, diagnostic.code, diagnostic.range, diagnosticContent.length > 1);
                    case DiagnosticCode.invalidFilter:
                        return createRemovalCodeAction(document, diagnostic.code, diagnostic.range, [...diagnosticContent.matchAll(/:/g)].length > 1);
                    case DiagnosticCode.invalidField:
                    case DiagnosticCode.invalidTtsOption:
                        {
                            // Ranges to replace invalid value
                            const replaceRanges: vscode.Range[] = [diagnostic.range];
                            let subFieldNames = [...fieldNames];
                            
                            if (diagnostic.code === DiagnosticCode.invalidField) {
                                // Check if field is in a conditional, replace linked tag if it has one
                                const offset = document.offsetAt(diagnostic.range.start);
                                const templateDocument = parseTemplateDocument(embeddedDocument.content);
                                const conditional = getConditionalAtOffset(templateDocument.replacements, offset);
    
                                if (conditional?.linkedTag?.fieldSegment.field) {
                                    const { field: linkedField } = conditional.linkedTag.fieldSegment;
                                    replaceRanges.push(documentRange(document, linkedField.start, linkedField.end));
                                }
                                else if (isBackside && !conditional)
                                    subFieldNames.push("FrontSide");
                            }
                            // Replace 
                            return findSimilarStartEnd(diagnostic.code === DiagnosticCode.invalidField
                                    ? subFieldNames
                                    : ttsKeyValueArgs.map(arg => arg.key),
                                diagnosticContent.toLowerCase(), false)
                                .map(similarValue => {
                                    const workspaceEdit = new vscode.WorkspaceEdit();
                                    replaceRanges.forEach(range => {
                                        workspaceEdit.replace(document.uri, range, similarValue);
                                    });
                                    return createCodeAction(`Replace with '${similarValue}'`, workspaceEdit);
                                });
                        }
                    case DiagnosticCode.invalidTtsLanguageArg:
                        {
                            const spaceMatch = diagnosticContent.match(/^[\s\r\n]*/);
                            const workspaceEdit = new vscode.WorkspaceEdit();
                            const start = document.offsetAt(diagnostic.range.start);
                            workspaceEdit.replace(document.uri, documentRange(document,
                                start, start + (spaceMatch?.[0].length ?? 0 )),
                                "en_US ");
                            return createCodeAction("Insert default language argument 'en_US'", workspaceEdit);
                        }
                    case DiagnosticCode.missingOpeningTag:
                    case DiagnosticCode.missingClosingTag:
                        {
                            const isOpening = diagnostic.code === DiagnosticCode.missingClosingTag;
                            const oppositeChars = isOpening ? ["/"] : ["#", "^"];
                            return oppositeChars.map(oppositeChar => {
                                const workspaceEdit = new vscode.WorkspaceEdit();
                                const space = " ".repeat(diagnostic.range.start.character);
                                const content = diagnosticContent.replace(isOpening ? /[#^]/ : /\//, oppositeChar);
                                workspaceEdit.insert(document.uri,
                                    isOpening 
                                        ? diagnostic.range.end
                                        : diagnostic.range.start,
                                    isOpening
                                        ? "\n" + space + content
                                        : content + "\n" + space);
                                return createCodeAction(`Create matching ${oppositeChar} ${isOpening ? "closing" : "opening"} tag.`, workspaceEdit);
                            });
                        }
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

const getDiagnosticContent = (document: vscode.TextDocument, content: string, diagnostic: vscode.Diagnostic) => 
    content.substring(document.offsetAt(diagnostic.range.start), document.offsetAt(diagnostic.range.end));


const createCodeAction = (title: string, workspaceEdit: vscode.WorkspaceEdit, kind: vscode.CodeActionKind = vscode.CodeActionKind.QuickFix): vscode.CodeAction => {
    const action = new vscode.CodeAction(title, kind);
    action.edit = workspaceEdit;
    return action;
}

const createRemovalCodeAction = (
        document: vscode.TextDocument,
        code: keyof typeof removalName,
        range: vscode.Range,
        isMultiple: boolean
    ) => {
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.delete(document.uri, range);
    return createCodeAction(`Remove invalid ${isMultiple ? removalName[code].multiple : removalName[code].single}`, workspaceEdit);
}

const removalName = {
    [DiagnosticCode.invalidSpace]: {
        single: "space",
        multiple: "spaces",
    },
    [DiagnosticCode.invalidCharacter]: {
        single: "character",
        multiple: "characters"
    },
    [DiagnosticCode.invalidTtsOptionValue]: {
        single: "character",
        multiple: "values"
    },
    [DiagnosticCode.invalidFilter]: {
        single: "filter",
        multiple: "filters"
    }
} as const
