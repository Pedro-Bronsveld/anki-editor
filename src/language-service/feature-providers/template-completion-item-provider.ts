import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { uriPathToParts } from '../../note-types/uri-parser';
import { builtinFilters, clozeFieldDescription, specialFields, ttsDefaultLanguage, ttsOptionsList } from '../anki-builtin';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { getExtendedSpecialFieldNames, getExtendedSpecialFieldsList, getExtendedFiltersList } from '../anki-custom';
import { documentRange } from '../document-util';
import EmbeddedHandler from '../embedded-handler';
import { AstItemType, ConditionalStart, FilterArgumentKeyValue } from '../parser/ast-models';
import { getItemAtOffset, getUnavailableFieldNames, inItem } from '../parser/ast-utils';
import { isBackSide } from '../template-util';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { getClozeFieldNumber, isClozeReplacement } from '../cloze-fields';
import { quotedCodeBlock } from '../filter-examples';

export default class TemplateCompletionItemProvider extends LanguageFeatureProviderBase implements vscode.CompletionItemProvider {
    
    constructor(embeddedHandler: EmbeddedHandler, private ankiModelDataProvider: AnkiModelDataProvider) {
        super(embeddedHandler);
    }
    
    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null | undefined> {        
        const embeddedDocument = this.getEmbeddedByPosition(document, position);

        const completionItemList: vscode.CompletionItem[] = [];
        const fieldNames: string[] = [];
        const templateIsBackSide = isBackSide(document);
        let modelName: null | string = null;

        if (document.uri.scheme === ANKI_EDITOR_SCHEME_BASE) {
            // Field suggestions from the model can only be provided on documents loaded through Anki-Connect
            const uriParts = uriPathToParts(document.uri);
    
            if (uriParts.length >= 2) {
                // Create field suggestions
                modelName = uriParts[1];
                fieldNames.push(...(await this.ankiModelDataProvider.getFieldNames(modelName)));
            }
        }

        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {

            const templateDocument = this.parseTemplateDocument(embeddedDocument.content);

            const offset = document.offsetAt(position);
            // Find template replacement at the trigger position
            const replacement = templateDocument.replacements.find(replacement => inItem(replacement, offset)
                && offset >= replacement.start + 2 && offset <= replacement.end - 2);
            
            if (!replacement)
                return undefined;
                
            // Check if the trigger position is currently at a field position
            if (inItem(replacement.fieldSegment, offset)) {
                // Handle completions in a field segment

                // Get a list of all field names used in parent conditionals of this replacement,
                // these must potentially be filtered out of autocomplete suggestions.
                const unavailableFieldNames = getUnavailableFieldNames(replacement);
                
                // Suggest special fields and custom fields
                const replaceRange = replacement.fieldSegment.field
                    ? documentRange(document, replacement.fieldSegment.start, replacement.fieldSegment.field.end)
                    : new vscode.Range(document.positionAt(replacement.fieldSegment.start), position);
                completionItemList.push(...getExtendedSpecialFieldsList()
                    .filter(specialField => specialField.name !== "FrontSide" && !unavailableFieldNames.has(specialField.name))
                    .map(specialField => createCompletionItem(specialField.name,
                        specialFields.has(specialField.name)
                            ? vscode.CompletionItemKind.Constant
                            : vscode.CompletionItemKind.EnumMember,
                        "3", replaceRange, specialField.description, specialField.htmlDescription, true)));

                // Create completion items for field names
                completionItemList.push(...fieldNames
                    .filter(specialField => !unavailableFieldNames.has(specialField))
                    .map(fieldName => createCompletionItem(fieldName, vscode.CompletionItemKind.Field, "1", replaceRange)));

                // Show FrontSide suggestion only when in back side template
                if(replacement.type === AstItemType.replacement && templateIsBackSide && replacement.filterSegments.length === 0)
                    completionItemList.push(createCompletionItem("FrontSide", vscode.CompletionItemKind.Reference, "2", undefined, specialFields.get("FrontSide")?.description));
            }
            
            if (replacement.type === AstItemType.replacement ) {
                const filterSegment = getItemAtOffset(replacement.filterSegments, offset);
                
                // Check if the trigger position was at the key value position inside a tts filter segment
                if (filterSegment?.filter?.content === "tts") {
                    const { filter } = filterSegment;

                    if (filter.arguments.length === 0 || 
                        // tts language argument completion
                        (filter.arguments[0].type === AstItemType.filterArgumentKeyValue && offset <= filter.arguments[0].start)) {
                        const completion = createCompletionItem("en_US", vscode.CompletionItemKind.TypeParameter, "1", undefined, ttsDefaultLanguage.description)
                        const suffix = offset === filter.arguments[0]?.start ? " " : "";
                        completion.insertText = new vscode.SnippetString("${0:en_US}" + suffix);
                        completion.range = new vscode.Range(document.positionAt(filter.end + 1), position);
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
                                .map(({ name: key, value, description }) => {
                                const completion = createCompletionItem(key, vscode.CompletionItemKind.Variable, "1", undefined, description);
                                const prefix = filterSegment.content[offset - filterSegment.start - 1] === " " ? "" : " ";
                                completion.insertText = new vscode.SnippetString(prefix + key + "=${0:" + value + "}" + suffix);
                                return completion;
                            }
                        ));
                    }
                    
                }
                else if (filterSegment
                    || !replacement.fieldSegment.field
                    || replacement.fieldSegment.field && offset <= replacement.fieldSegment.field.start ) {
                    // Create builtin and custom filter suggestions, ending with colon if not already followed by one
                    const appendColon = !replacement.content.substring(offset - replacement.start).match(/^\s*(?=:)/);
                    const suffix = (appendColon ? ":" : "");
                    completionItemList.push(...getExtendedFiltersList().map(filter =>
                        createCompletionItem(filter.name + suffix, 
                            builtinFilters.has(filter.name)
                                ? vscode.CompletionItemKind.Function
                                : vscode.CompletionItemKind.Value,
                            "4", undefined, filter.description, filter.htmlDescription)
                    ));
    
                    // Suggest builtin tts filter as a snippet
                    const ttsCompletion = createCompletionItem("tts en_US" + suffix, vscode.CompletionItemKind.Function, "4", undefined, builtinFilters.get("tts")?.description);
                    ttsCompletion.insertText = new vscode.SnippetString("tts ${0:en_US}" + suffix);
                    completionItemList.push(ttsCompletion);
                }
                
            }
            else if (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) {
                if (modelName && await this.ankiModelDataProvider.probablyCloze(modelName)) {
                    // Create cloze field suggestions
                    const clozeNumberNames = [...new Set(templateDocument.replacements
                        .filter(replacement => isClozeReplacement(replacement))
                        .map(replacement => replacement.fieldSegment.field)
                        .filter((field): field is Exclude<typeof field, undefined> => field !== undefined)
                        .map(({ content }) => content))]
                        .map<[number, string]>(content => [getClozeFieldNumber(content), content])
                        .sort(([numA], [numB]) => numA - numB);

                    const maxConsecutiveNum = [...clozeNumberNames].reduce((previousNum, [currentNum]) => currentNum === previousNum + 1 ? currentNum : previousNum, 0);

                    clozeNumberNames.splice(maxConsecutiveNum, 0, [maxConsecutiveNum + 1, `c${maxConsecutiveNum + 1}`]);                      
                    
                    completionItemList.push(...clozeNumberNames
                        .map(([, name]) => createCompletionItem(name, vscode.CompletionItemKind.Reference, "3", undefined,
                            clozeFieldDescription + " For example:\n\n" +
                            quotedCodeBlock("text", `Some {{${name}::Hidden Text}}`)))
                    );
                }

                // Preselect the field matching the conditional opening field when providing completions in a conditional closing tag
                if (replacement.type === AstItemType.conditionalEnd) {

                    const openingTag = templateDocument.replacements
                        .find((otherReplacement): otherReplacement is ConditionalStart => otherReplacement.type === AstItemType.conditionalStart
                            && replacement.parentConditional === otherReplacement
                            && !otherReplacement.linkedTag);
                    
                    if (openingTag) {
                        const completionItem = completionItemList.find(completionItem =>
                            (typeof completionItem.label === "object"
                                ? completionItem.label.label
                                : completionItem.label) === openingTag.fieldSegment.field?.content)
                        if (completionItem)
                            completionItem.preselect = true;
                    }
                    
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

        const offset = document.offsetAt(position);
        const preChar = document.getText().substring(offset-1, offset);
        if (preChar.match(/[#^/{\s]/)){
            // Provide snippets for standard replacement and conditional replacement tags and blocks
            const optionFieldNames = (fieldNames.length > 0 ? fieldNames : ["Field"])
                .concat(
                    getExtendedSpecialFieldNames().concat(templateIsBackSide ? "FrontSide" : []).sort()
                ).map(option => option.replace(/([,|])/g, "\\$1"));
            const isPreChar = preChar.match(/[#^/]/) !== null;
            builtinCompletionList.items.push(...[
                    { start: "",  detail: "Anki template replacement"},
                    { start: "cloze:",  detail: "Anki cloze filter and field replacement"},
                    { start: "hint:",  detail: "Anki hint filter and field replacement"},
                    { start: "type:",  detail: "Anki type filter and field replacement"},
                    { start: "#", detail: "Anki if filled opening tag"},
                    { start: "^", detail: "Anki if empty opening tag"},
                    { start: "/", detail: "Anki if block closing tag" }
                ]
                .flatMap(({start, detail}, index) => {
                    const isConditionalStart = start.match(/[#^]/)
                    const options = optionFieldNames
                        .filter(option => !(option === "FrontSide" && (isConditionalStart || !templateIsBackSide || start.length > 0)) )
                        .join(",");

                    return (isConditionalStart ? [false, true] : [false]).map(closeBlock => {
                        const completion = createCompletionItem(`{{${start}Field}}` + (closeBlock ? " ... {{/Field}}" : ""),
                                vscode.CompletionItemKind.Snippet,
                                `anki-${closeBlock}${index}${start}`,
                                documentRange(document, offset - (isPreChar ? 1 : 0), offset)
                            );
                        completion.insertText = new vscode.SnippetString("{{" + start + "${1|" + options + "|}}}" + (closeBlock ? "\n\t$0\n{{/${1|" + options + "|}}}" : "$0"));
                        completion.detail = `${detail}${closeBlock ? " and close block" : ""}.`;
                        completion.preselect = isPreChar;
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
        range?: vscode.Range | { inserting: vscode.Range; replacing: vscode.Range },
        documentationMarkdown?: string,
        documentationHtml?: boolean,
        themeIcons?: boolean
    ): vscode.CompletionItem => {
    const completion = new vscode.CompletionItem(label, kind);
    completion.sortText = sortText;
    completion.range = range;
    if (documentationMarkdown) {
        const markdown = new vscode.MarkdownString(documentationMarkdown, themeIcons);
        markdown.supportHtml = documentationHtml;
        completion.documentation = markdown;
    }
    return completion;
}
