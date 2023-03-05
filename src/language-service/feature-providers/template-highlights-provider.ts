import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { documentRange, getReplacementAtOffset } from '../document-util';
import { AstItemType } from '../parser/ast-models';
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

            const replacement = getReplacementAtOffset(templateDocument.replacements, document.offsetAt(position));

            const highlights: vscode.DocumentHighlight[] = [];
            
            if (!replacement)
                return undefined;
            else if (replacement.type === AstItemType.replacement) {

            }
            else if (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) {
                const { field } = replacement.fieldSegment;

                if (!field)
                    return highlights;
                
                highlights.push(new vscode.DocumentHighlight(documentRange(document, field.start, field.end)));
                
                if (!replacement.linkedTag?.fieldSegment.field)
                    return highlights;
                
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