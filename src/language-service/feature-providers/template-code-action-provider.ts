import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { uriPathToParts } from '../../note-types/uri-parser';
import { ttsOptionsNames } from '../anki-builtin';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { getExtendedFilterNames, getExtendedFilters, getExtendedSpecialFieldNames } from '../anki-custom';
import { DiagnosticCode } from '../diagnostic-codes';
import { documentRange } from '../document-util';
import EmbeddedHandler from '../embedded-handler';
import { findSimilarStartEnd } from '../find-similar';
import { AstItemType } from '../parser/ast-models';
import { getItemAtOffset, getUnavailableFieldNames } from '../parser/ast-utils';
import { isBackSide } from '../template-util';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateCodeActionProvider extends LanguageFeatureProviderBase implements vscode.CodeActionProvider {

    constructor(embeddedHandler: EmbeddedHandler, private ankiModelDataProvider: AnkiModelDataProvider) {
        super(embeddedHandler);
    }
    
    async provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): Promise<(vscode.CodeAction | vscode.Command)[] | null | undefined> {

        const embeddedDocument = this.getEmbeddedByPosition(document, range.start);

        if (embeddedDocument.languageId !== TEMPLATE_LANGUAGE_ID)
            return [];
        
        const uriParts = uriPathToParts(document.uri);
        const modelAvailable = document.uri.scheme === ANKI_EDITOR_SCHEME_BASE;
        const modelName = modelAvailable && uriParts.length >= 2 ? uriParts[1] : "";
        const fieldNames = (modelAvailable ? await this.ankiModelDataProvider.getFieldNames(modelName) : [])
            .concat(getExtendedSpecialFieldNames());
        const modelProbablyCloze = modelAvailable && modelName && await this.ankiModelDataProvider.probablyCloze(modelName);
        
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
                    case DiagnosticCode.invalidFilterArgument:
                        return createRemovalCodeAction(document, diagnostic.code, diagnostic.range, [...diagnosticContent.matchAll(/[^\s]+/g)].length > 1);
                    case DiagnosticCode.invalidField:
                    case DiagnosticCode.invalidTtsOption:
                    case DiagnosticCode.invalidFilterName:
                        {
                            // Ranges to replace invalid value
                            const replaceRanges: vscode.Range[] = [diagnostic.range];
                            let subFieldNames = [...fieldNames];
                            
                            if (diagnostic.code === DiagnosticCode.invalidField) {
                                // Check if field is in a conditional tag, replace linked tag if it has one
                                const offset = document.offsetAt(diagnostic.range.start);
                                const templateDocument = this.parseTemplateDocument(embeddedDocument.content);
                                const replacement = getItemAtOffset(templateDocument.replacements, offset);
    
                                if (replacement?.type !== AstItemType.replacement && replacement?.linkedTag?.fieldSegment.field) {
                                    const { field: linkedField } = replacement.linkedTag.fieldSegment;
                                    replaceRanges.push(documentRange(document, linkedField.start, linkedField.end));
                                }
                                else if (isBackside && replacement?.type === AstItemType.replacement)
                                    subFieldNames.push("FrontSide");
                                
                                // Remove unavailable field names from field replacement suggestions
                                if (replacement) {
                                    const unavailableFieldNames = getUnavailableFieldNames(replacement);
                                    subFieldNames = subFieldNames.filter(fieldName => !unavailableFieldNames.has(fieldName));
                                }
                            }
                            // Replace 
                            return findSimilarStartEnd(diagnostic.code === DiagnosticCode.invalidField
                                    ? subFieldNames
                                    : nameReplacements[diagnostic.code]()
                                        .filter(option => diagnostic.code !== DiagnosticCode.invalidFilterName
                                            || !(modelAvailable && !modelProbablyCloze && (option === "cloze" || option === "cloze-only"))),
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
                    case DiagnosticCode.missingTtsLanguageArg:
                        {
                            const spaceMatch = diagnosticContent.match(/^(tts)?([\s\r\n]*)/);
                            const workspaceEdit = new vscode.WorkspaceEdit();
                            const missing = diagnostic.code === DiagnosticCode.missingTtsLanguageArg;
                            const start = document.offsetAt(diagnostic.range.start) + (missing ? 3 : 0);
                            const leadingSpace = missing ? " " : "";
                            const trailingSpace = missing ? "" : " ";
                            workspaceEdit.replace(document.uri,
                                documentRange(document, start, start + (spaceMatch?.[2]?.length ?? 0 )),
                                leadingSpace + "en_US" + trailingSpace);
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
                    case DiagnosticCode.incorrectSpace:
                        {
                            const workspaceEdit = new vscode.WorkspaceEdit();
                            workspaceEdit.replace(document.uri, diagnostic.range, " ");
                            return createCodeAction("Replace with single space.", workspaceEdit)
                        }
                    case DiagnosticCode.missingClozeFilter:
                        {
                            const workspaceEdit = new vscode.WorkspaceEdit();
                            workspaceEdit.replace(document.uri, diagnostic.range, "cloze:");
                            return createCodeAction("Insert cloze filter.", workspaceEdit);
                        }
                    case DiagnosticCode.missingPrecedingFilter:
                        {
                            const builtinFilter = getExtendedFilters(true).get(diagnosticContent);
                            if (!builtinFilter?.requiredPrecedingFilter)
                                return;
                            const workspaceEdit = new vscode.WorkspaceEdit();
                            workspaceEdit.insert(document.uri, diagnostic.range.start, builtinFilter.requiredPrecedingFilter + ":");
                            return createCodeAction(`Insert missing '${ builtinFilter.requiredPrecedingFilter }' filter.`, workspaceEdit);
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

const nameReplacements = {
    [DiagnosticCode.invalidTtsOption]: () => ttsOptionsNames,
    [DiagnosticCode.invalidFilterName]: () => getExtendedFilterNames(true)
} as const

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
    },
    [DiagnosticCode.invalidFilterArgument]: {
        single: "filter argument",
        multiple: "filter arguments"
    }
} as const
