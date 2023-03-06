import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { AstItemType } from '../parser/ast-models';
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
                
            }

            if (replacement.type === AstItemType.replacement) {

            }
            else if (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) {
                
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

            allHovers.contents.push(...(hovers.length > 0 ? hovers[0].contents : []))
        }
        
        return allHovers;
    }
}
