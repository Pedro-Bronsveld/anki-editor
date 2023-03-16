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

                // Highlight all filters in the document with the same name
                const thisFilter = getItemAtOffset(replacement.filterSegments
                    .filter((filterSegment): filterSegment is RequiredProp<FilterSegment, "filter"> =>
                        filterSegment.filter !== undefined)
                    .map(filterSegment => filterSegment.filter), offset);
                
                if (!thisFilter)
                    return;
                
                const filterOccurences = getFiltersByName(templateDocument.replacements, thisFilter.content);

                highlights.push(...filterOccurences.map(filter => new vscode.DocumentHighlight(
                    documentRange(document, filter.start, filter.end)
                )));
                
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