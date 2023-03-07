import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { builtinFilters, specialFields, ttsOptions } from '../anki-builtin';
import { documentRange } from '../document-util';
import { AstItemType, FilterArgumentKeyValue } from '../parser/ast-models';
import { getItemAtOffset, inItem } from '../parser/ast-utils';
import { parseTemplateDocument } from '../parser/template-parser';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateHoverProvider extends LanguageFeatureProviderBase implements vscode.HoverProvider {

    async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null | undefined> {
        const allHovers: vscode.Hover = {
            contents: []
        };
        
        const embeddedDocument = this.getEmbeddedByPosition(document, position);
        
        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {
            // Anki template hover provider
            const templateDocument = parseTemplateDocument(embeddedDocument.content);
            const offset = document.offsetAt(position);
            
            const replacement = getItemAtOffset(templateDocument.replacements, offset);

            if (!replacement)
                return undefined;

            const { field } = replacement.fieldSegment;

            if (field && inItem(field, offset)) {
                const builtinField = specialFields.get(field.content);
                if (!builtinField)
                    return;
                return new vscode.Hover(
                    new vscode.MarkdownString(builtinField.description),
                    documentRange(document, field.start, field.end)
                );
            }
            else if (replacement.type === AstItemType.replacement) {

                const filterSegment = getItemAtOffset(replacement.filterSegments, offset);

                if (!filterSegment || !filterSegment.filter)
                    return;

                const { filter } = filterSegment;

                if (inItem(filterSegment.filter, offset)) {
                    const builtinFilter = builtinFilters.get(filter.content);
                    if (!builtinFilter)
                        return;
                    return new vscode.Hover(
                        new vscode.MarkdownString(builtinFilter.description),
                        documentRange(document, filter.start, filter.end)
                    );
                }
                else if (filterSegment.filter.content === "tts") {

                    const languageArg = filterSegment.filter.arguments[0];
                    if (languageArg) {
                        if (languageArg.type === AstItemType.filterArgument && inItem(languageArg, offset)) {
                            return new vscode.Hover(new vscode.MarkdownString("Code of the language that the tts command will use for speech conversion.\n\n" +
                                "Use the `tts-voices` filter on a card template to display a list of available tts languages on a system."),
                                documentRange(document, languageArg.start, languageArg.end));
                        }
                    }

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
                
        }
        else {
            // html, javascript, css hover provider
    
            console.log("hover");
    
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                embeddedDocument.virtualUri,
                position,
            )

            return new vscode.Hover(hovers.length > 0 ? hovers[0].contents : []);
        }
    }
}
