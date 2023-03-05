import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { documentRange, getMatchingStandardFields, getReplacementAtOffset } from '../document-util';
import { AstItemType, FieldSegment, StandardReplacement } from '../parser/ast-models';
import { inItem } from '../parser/ast-utils';
import { parseTemplateDocument } from '../parser/template-parser';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateHighlightsProvider extends LanguageFeatureProviderBase implements vscode.DocumentHighlightProvider {
    
    async provideDocumentHighlights(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.DocumentHighlight[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByPosition(document, position);
        
        if (!embeddedDocument)
            return;
        
        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {
            // Anki template highlighting
            const templateDocument = parseTemplateDocument(embeddedDocument.content);
            
            const offset = document.offsetAt(position);
            const replacement = getReplacementAtOffset(templateDocument.replacements, offset);

            const highlights: vscode.DocumentHighlight[] = [];
            
            if (!replacement)
                return highlights;
            
            const { field } = replacement.fieldSegment;

            if (!field || !inItem(field, offset))
                return highlights;
            
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