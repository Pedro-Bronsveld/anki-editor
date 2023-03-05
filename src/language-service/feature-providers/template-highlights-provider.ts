import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { documentRange } from '../document-util';
import { AstItemType, ConditionalEnd, ConditionalStart, FieldSegment, Replacement } from '../parser/ast-models';
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
            
            const conditionalStart = templateDocument.replacements
                .find((replacement):replacement is (ConditionalStart | ConditionalEnd) & Required<Pick<ConditionalStart | ConditionalEnd, "linkedTag">> & { fieldSegment: FieldSegment & Required<Pick<FieldSegment, "field">> } => 
                    (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) &&
                    replacement.linkedTag !== undefined && 
                    replacement.fieldSegment.field !== undefined &&
                    inItem(replacement.fieldSegment.field, document.offsetAt(position)));
                
            if (!conditionalStart || !conditionalStart.linkedTag.fieldSegment.field)
                return [];
            
            const { field } = conditionalStart.fieldSegment;
            const { field: linkedField } = conditionalStart.linkedTag.fieldSegment;

            return [
                new vscode.DocumentHighlight(documentRange(document, field.start, field.end)),
                new vscode.DocumentHighlight(documentRange(document, linkedField.start, linkedField.end))
            ];
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