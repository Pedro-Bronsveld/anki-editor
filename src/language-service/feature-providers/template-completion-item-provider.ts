import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { uriPathToParts } from '../../note-types/uri-parser';
import { builtinFiltersNames, specialFieldsNames, ttsOptionsList } from '../anki-builtin';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { documentRange } from '../document-util';
import { AstItemType, FilterArgumentKeyValue } from '../parser/ast-models';
import { getItemAtOffset, getUnavailableFieldNames, inItem } from '../parser/ast-utils';
import { parseTemplateDocument } from '../parser/template-parser';
import { isBackSide } from '../template-util';
import VirtualDocumentProvider from '../virtual-documents-provider';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateCompletionItemProvider extends LanguageFeatureProviderBase implements vscode.CompletionItemProvider {
    
    constructor(virtualDocumentProvider: VirtualDocumentProvider, private ankiModelDataProvider: AnkiModelDataProvider) {
        super(virtualDocumentProvider);
    }
    
    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {        
        const embeddedDocument = this.getEmbeddedByPosition(document, position);

        const completionItemList: vscode.CompletionItem[] = [];
        const fieldNames: string[] = [];

        if (document.uri.scheme === ANKI_EDITOR_SCHEME_BASE) {
            // Field suggestions from the model can only be provided on documents loaded through Anki-Connect
            const uriParts = uriPathToParts(document.uri);
    
            if (uriParts.length >= 2) {
                // Create field suggestions
                const modelName = uriParts[1];
                fieldNames.push(...(await this.ankiModelDataProvider.getFieldNames(modelName)));
            }
        }

        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {

            const templateDocument = parseTemplateDocument(embeddedDocument.content);

            const offset = document.offsetAt(position);
            // Find template replacement at the trigger position
            const replacement = templateDocument.replacements.find(replacement => inItem(replacement, offset));
            
            if (!replacement)
                return undefined;
                
            // Check if the trigger position is currently at a field position
            if (inItem(replacement.fieldSegment, offset)) {
                // Handle completions in a field segment

                // Get a list of all field names used in parent conditionals of this replacement,
                // these must potentially be filtered out of autocomplete suggestions.
                const unavailableFieldNames = getUnavailableFieldNames(replacement);
                
                // Suggest special fields
                const replaceRange = replacement.fieldSegment.field
                    ? documentRange(document, replacement.fieldSegment.start, replacement.fieldSegment.field.end)
                    : new vscode.Range(document.positionAt(replacement.fieldSegment.start), position);
                completionItemList.push(...specialFieldsNames
                    .filter(specialField => !unavailableFieldNames.has(specialField))
                    .map(specialField => createCompletionItem(specialField, vscode.CompletionItemKind.Constant, "3", replaceRange)));

                // Create completion items for field names
                completionItemList.push(...fieldNames
                    .filter(specialField => !unavailableFieldNames.has(specialField))
                    .map(fieldName => createCompletionItem(fieldName, vscode.CompletionItemKind.Field, "1", replaceRange)));

                // Show FrontSide suggestion only when in back side template
                if(replacement.type === AstItemType.replacement && isBackSide(document))
                    completionItemList.push(createCompletionItem("FrontSide", vscode.CompletionItemKind.Reference, "2"));
            }
            
            if (replacement.type === AstItemType.replacement ) {
                const filterSegment = getItemAtOffset(replacement.filterSegments, offset);
                
                // Check if the trigger position was at the key value position inside a tts filter segment
                if (filterSegment?.filter?.content === "tts") {
                    const { filter } = filterSegment;

                    if (filter.arguments.length === 0 || 
                        // tts language argument completion
                        (filter.arguments[0].type === AstItemType.filterArgumentKeyValue && offset <= filter.arguments[0].start)) {
                        const completion = createCompletionItem("en_US", vscode.CompletionItemKind.Property, "1")
                        const suffix = offset === filter.arguments[0]?.start ? " " : "";
                        completion.insertText = new vscode.SnippetString("${0:en_US}" + suffix);
                        completionItemList.push(completion);
                    }
                    else if (offset > filter.arguments[0]?.end) {
                        // tts key value arguments completion
                        const suffix = filter.arguments.some(argument => argument.start === offset) ? " " : "";
                        const usedOptions = new Set(filter.arguments
                            .filter((arg): arg is FilterArgumentKeyValue => arg.type === AstItemType.filterArgumentKeyValue)
                            .map(arg => arg.key.content));
                        completionItemList.push(...ttsOptionsList
                                .filter(({ name: key, value }) => !usedOptions.has(key))
                                .map(({ name: key, value }) => {
                                const completion = createCompletionItem(key, vscode.CompletionItemKind.Property, "1");
                                const prefix = filterSegment.content[offset - filterSegment.start - 1] === " " ? "" : " ";
                                completion.insertText = new vscode.SnippetString(prefix + key + "=${0:" + value + "}" + suffix);
                                return completion;
                            }
                        ));
                    }
                    
                }
                else {
                    // Create builtin filter suggestions, ending with colon if not already followed by one
                    const appendColon = !replacement.content.substring(offset - replacement.start).match(/^\s*(?=:)/);
                    const suffix = (appendColon ? ":" : "");
                    completionItemList.push(...builtinFiltersNames.map(filterName =>
                        createCompletionItem(filterName + suffix, vscode.CompletionItemKind.Function, "4")
                    ));
    
                    // Suggest builtin tts filter as a snippet
                    const ttsCompletion = createCompletionItem("tts en_US" + suffix, vscode.CompletionItemKind.Function, "4");
                    ttsCompletion.insertText = new vscode.SnippetString("tts ${0:en_US}" + suffix);
                    completionItemList.push(ttsCompletion);
                }
                
            }
            
            return completionItemList;
        }

        // Html, javascript and css forwarding
        const builtinCompletionList = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            embeddedDocument.virtualUri,
            position,
            context.triggerCharacter
        );

        completionItemList.push(...builtinCompletionList.items);

        {
            const offset = document.offsetAt(position);
            const preChar = document.getText().substring(offset-1, offset);
            builtinCompletionList.items.push(...[
                    { char: "#", detail: "If filled opening"}, 
                    { char: "^", detail: "If empty opening"},
                    { char: "/", detail: "Closing tag" }
                ]
                .flatMap(({char, detail}, index) => {
                    const options = fieldNames.join(",") || "Field";
                    const isPreChar = char === preChar;

                    return (char === "/" ? [false] : [false, true]).map(closeBlock => {
                        const completion = createCompletionItem(`{{${char}Field}}` + (closeBlock ? " ... {{/Field}}" : ""),
                                vscode.CompletionItemKind.Snippet,
                                undefined,
                                documentRange(document, offset - (isPreChar ? 1 : 0), offset)
                            );
                        completion.insertText = new vscode.SnippetString("{{#${1|" + options + "|}}}" + (closeBlock ? "\n\t$0\n{{/${1|" + options + "|}}}" : "$0"));
                        completion.detail = `${detail} ${closeBlock ? "and close block" : ""}.`;
                        completion.preselect = isPreChar;
                        completion.sortText = `conditional-${closeBlock}${index}${char}`;
                        return completion;
                    });
                    
                }
            ));            
        }

        return {
            ...builtinCompletionList,
            items: builtinCompletionList.items.filter(item => item.kind !== vscode.CompletionItemKind.Text)
        };
    }
}

const createCompletionItem = (label: string | vscode.CompletionItemLabel,
        kind?: vscode.CompletionItemKind,
        sortText?: string,
        range?: vscode.Range | { inserting: vscode.Range; replacing: vscode.Range }
    ): vscode.CompletionItem => {
    const completion = new vscode.CompletionItem(label, kind);
    completion.sortText = sortText;
    completion.range = range;
    return completion;
}
