import * as vscode from 'vscode';
import { getLanguageService, LanguageService, TextDocument, FoldingRangeKind } from 'vscode-html-languageservice';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { AstItemType, ConditionalStart } from '../parser/ast-models';
import { parseTemplateDocument } from '../parser/template-parser';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateFoldingRangeProvider extends LanguageFeatureProviderBase implements vscode.FoldingRangeProvider {

    private htmlLanguageService: LanguageService = getLanguageService();
    
    provideFoldingRanges(document: vscode.TextDocument, context: vscode.FoldingContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {

        const allFoldingRanges: vscode.FoldingRange[] = [];
        
        // Anki template folding
        {
            const embeddedTemplate = this.getEmbeddedByLanguage(document, TEMPLATE_LANGUAGE_ID);

            if (embeddedTemplate) {
                const templateDocument = parseTemplateDocument(embeddedTemplate.content);
                
                // Create folding ranges for linked conditional opening and closing tags
                const conditionalFoldingRanges = templateDocument.replacements
                    .filter((conditional): conditional is ConditionalStart & Required<Pick<ConditionalStart, "linkedTag">> =>
                        conditional.type === AstItemType.conditionalStart &&
                        conditional.linkedTag !== undefined)
                    .map(conditional =>
                    new vscode.FoldingRange(
                        document.positionAt(conditional.start).line,
                        document.positionAt(conditional.linkedTag.start).line - 1
                    ));
                
                allFoldingRanges.push(...conditionalFoldingRanges);
            }
        }

        // html folding
        {
            const htmlTextDocument = TextDocument.create(document.uri.toString(), "html", document.version, document.getText());
            
            const htmlFoldingRanges = this.htmlLanguageService.getFoldingRanges(htmlTextDocument, context);
            
            allFoldingRanges.push(...htmlFoldingRanges.map(foldingRange =>
                new vscode.FoldingRange(
                    foldingRange.startLine,
                    foldingRange.endLine,
                    foldingRange.kind ? foldingRangeKindMap[foldingRange.kind] : undefined
                )));
        }
        
        return allFoldingRanges;
    }

}

const foldingRangeKindMap: Record<string, vscode.FoldingRangeKind> = {
    [FoldingRangeKind.Comment]: vscode.FoldingRangeKind.Comment,
    [FoldingRangeKind.Imports]: vscode.FoldingRangeKind.Imports,
    [FoldingRangeKind.Region]: vscode.FoldingRangeKind.Region
} as const;
