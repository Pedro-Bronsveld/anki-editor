import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { RequiredProp } from '../../models/required-prop';
import { documentRange } from '../document-util';
import { AstItemType, Filter, FilterSegment } from '../parser/ast-models';
import { getFiltersByName, getItemAtOffset, getMatchingStandardFields, inItem } from '../parser/ast-utils';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateHighlightsProvider extends LanguageFeatureProviderBase implements vscode.DocumentHighlightProvider {
    
    async provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.DocumentHighlight[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByPosition(document, position);
        
        if (!embeddedDocument)
            return;
        
        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {
            // Anki template highlighting
            const templateDocument = this.parseTemplateDocument(embeddedDocument.content);
            
            const offset = document.offsetAt(position);
            const replacement = getItemAtOffset(templateDocument.replacements, offset);

            
            if (!replacement)
                return undefined;
            
            const highlights: vscode.DocumentHighlight[] = [];
            

            if (replacement.fieldSegment.field && inItem(replacement.fieldSegment.field, offset)) {
                const { field } = replacement.fieldSegment;
            
                // Highlight field at position
                highlights.push(new vscode.DocumentHighlight(documentRange(document, field.start, field.end)));
                    
                if (replacement.type === AstItemType.replacement) {
                    // Highlight same field names in other standard replacements
                    highlights.push(...getMatchingStandardFields(templateDocument.replacements, field)
                        .map(replacement => {
                            const { field: otherField } = replacement.fieldSegment;
                            return new vscode.DocumentHighlight(documentRange(document, otherField.start, otherField.end));
                        }));
                }
                else if (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) {
                    if (!replacement.linkedTag?.fieldSegment.field)
                        return highlights;
                    
                    // Highlight linked conditional field
                    const { field: linkedField } = replacement.linkedTag.fieldSegment;
    
                    highlights.push(new vscode.DocumentHighlight(documentRange(document, linkedField.start, linkedField.end)));
                }
            }
            else if (replacement.type === AstItemType.replacement) {

                // Highlighting of filter names, filter arguments, and filter options
                const inFilterSegment = getItemAtOffset(replacement.filterSegments
                    .filter((filterSegment): filterSegment is RequiredProp<FilterSegment, "filter"> =>
                        filterSegment.filter !== undefined), offset);
                
                if (!inFilterSegment)
                    return
                
                if (inItem(inFilterSegment.filter, offset)) {
                    // Highlight filter name and all other occurences of this filter name
                    const filterOccurences = getFiltersByName(templateDocument.replacements, inFilterSegment.filter.content);
    
                    highlights.push(...filterOccurences.map((filter) => new vscode.DocumentHighlight(
                        documentRange(document, filter.start, filter.end)
                    )));
                }
                else if (inFilterSegment.filter.content === "tts" ) {

                    // Highlight tts arguments
                    const inArgument = getItemAtOffset(inFilterSegment.filter.arguments, offset);
                    
                    if (inArgument?.type === AstItemType.filterArgument)
                        // Highlight tts language argument
                        highlights.push(new vscode.DocumentHighlight(
                            documentRange(document, inArgument.start, inArgument.end)
                        ));
                    else if (inArgument?.type === AstItemType.filterArgumentKeyValue) {
                        // Highlight tts options keys and values
                        const inKeyValuePart = getItemAtOffset([inArgument.key, ...inArgument.values], offset)

                        if (inKeyValuePart)
                            highlights.push(new vscode.DocumentHighlight(
                                documentRange(document, inKeyValuePart.start, inKeyValuePart.end)
                            ));
                        
                    }
                    
                }
                
            }

            return highlights;
        }
        
        // html, javascript, css forwarding
        
        const highlights = await vscode.commands.executeCommand<vscode.DocumentHighlight[]>(
            'vscode.executeDocumentHighlights',
            embeddedDocument.virtualUri,
            position
        );
        
        return highlights;
    }

}