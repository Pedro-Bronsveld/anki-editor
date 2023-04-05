import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { uriPathToParts } from '../../note-types/uri-parser';
import { clozeFieldDescription, conditionalCharacters, getConditionalExample, ttsDefaultLanguage, ttsOptions } from '../anki-builtin';
import { getExtendedFilters, getExtendedSpecialFields } from '../anki-custom';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { isClozeReplacement } from '../cloze-fields';
import { documentRange } from '../document-util';
import EmbeddedHandler from '../embedded-handler';
import { docsLink, quotedCodeBlock } from '../filter-examples';
import { AstItemType, FilterArgumentKeyValue } from '../parser/ast-models';
import { getItemAtOffset, inItem } from '../parser/ast-utils';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateHoverProvider extends LanguageFeatureProviderBase implements vscode.HoverProvider {

    constructor(embeddedHandler: EmbeddedHandler, private ankiModelDataProvider: AnkiModelDataProvider) {
        super(embeddedHandler);
    }

    async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null | undefined> {
        
        const embeddedDocument = this.getEmbeddedByPosition(document, position);
        
        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {
            // Anki template hover provider
            const templateDocument = this.parseTemplateDocument(embeddedDocument.content);
            const offset = document.offsetAt(position);
            
            const replacement = getItemAtOffset(templateDocument.replacements, offset);

            if (!replacement)
                return undefined;

            const { field } = replacement.fieldSegment;

            if (field && inItem(field, offset)) {
                const fieldRange = documentRange(document, field.start, field.end);
                
                // Provide hover info for special builtin field names and custom field names
                const knownField = getExtendedSpecialFields().get(field.content);
                if (knownField) {
                    const markdown = new vscode.MarkdownString(knownField.description, true);
                    markdown.supportHtml = knownField.htmlDescription;
                    return new vscode.Hover(
                        markdown,
                        documentRange(document, field.start, field.end)
                    );
                }
                
                // Try to provide hover info for field of note type
                if (document.uri.scheme === ANKI_EDITOR_SCHEME_BASE) {
                    const uriParts = uriPathToParts(document.uri);
                    const modelName = uriParts[1];
                    const modelFieldNames = new Set(await this.ankiModelDataProvider.getFieldNames(modelName));
                    const modelProbablyCloze = await this.ankiModelDataProvider.probablyCloze(modelName);
                    
                    if (modelFieldNames.has(field.content))
                        return new vscode.Hover(new vscode.MarkdownString(`Field in note type "${modelName}"` +
                            docsLink("Basic Replacements", "https://docs.ankiweb.net/templates/fields.html#basic-replacements")), fieldRange);
                    else if (modelProbablyCloze && isClozeReplacement(replacement))
                        return new vscode.Hover(new vscode.MarkdownString(
                            clozeFieldDescription + " For example:\n\n" +
                            quotedCodeBlock("text", `Some {{${field.content}::Hidden Text}}`)), fieldRange);
                }
                
                return;
            }
            else if (replacement.type === AstItemType.replacement) {

                const filterSegment = getItemAtOffset(replacement.filterSegments, offset);

                if (!filterSegment || !filterSegment.filter)
                    return;

                const { filter } = filterSegment;

                if (inItem(filterSegment.filter, offset)) {
                    // Provide hover info for builtin and custom filters
                    const knownFilter = getExtendedFilters().get(filter.content);
                    
                    if (!knownFilter)
                        return;
                    
                    const markdown = new vscode.MarkdownString(knownFilter.description);
                    markdown.supportHtml = knownFilter.htmlDescription;
                    
                    return new vscode.Hover(
                        markdown,
                        documentRange(document, filter.start, filter.end)
                    );
                }
                else if (filterSegment.filter.content === "tts") {

                    // Provide hover info for tts language argument
                    const languageArg = filterSegment.filter.arguments[0];
                    if (languageArg && languageArg.type === AstItemType.filterArgument && inItem(languageArg, offset)) {
                        return new vscode.Hover(new vscode.MarkdownString(ttsDefaultLanguage.description),
                            documentRange(document, languageArg.start, languageArg.end));
                    }

                    // Provide hover info for tts option key
                    const filterOptionKey = getItemAtOffset(filterSegment.filter.arguments.slice(1)
                        .filter((arg): arg is FilterArgumentKeyValue => 
                        arg.type === AstItemType.filterArgumentKeyValue)
                        .map(arg => arg.key), offset);
                    
                    if(!filterOptionKey)
                        return;

                    const builtinTtsOption = ttsOptions.get(filterOptionKey.content);
                    
                    if (!builtinTtsOption)
                        return;
                    
                    return new vscode.Hover(
                        new vscode.MarkdownString(builtinTtsOption.description),
                        documentRange(document, filter.start, filter.end)
                    );

                }
            }
            else if ((replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd)
                && (offset >= replacement.start && offset < replacement.conditionalChar.end
                    || offset >= replacement.end - 2 && offset < replacement.end
                )) {
                // Provide hover info for conditional start and end tags

                const { conditionalChar } = replacement;
                return new vscode.Hover(
                    new vscode.MarkdownString(conditionalCharacters[conditionalChar.content].description +
                        "\n\n### Example\n\n" +
                        getConditionalExample(replacement.linkedTag?.conditionalChar.content !== "/"
                            ? replacement.linkedTag?.conditionalChar.content
                            : undefined)),
                    documentRange(document, replacement.start, conditionalChar.end)
                );
            }
                
        }
        else {
            // html, javascript, css hover provider
    
            // console.log("hover");
    
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                embeddedDocument.virtualUri,
                position,
            )

            return new vscode.Hover(hovers.length > 0 ? hovers[0].contents : []);
        }
    }
}
