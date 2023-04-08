import * as vscode from 'vscode';
import { getLanguageService, LanguageService, TextDocument, FoldingRangeKind as HtmlFoldingRangeKind } from 'vscode-html-languageservice';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { RequiredProp } from '../../models/required-prop';
import { AstItemType, ConditionalStart } from '../parser/ast-models';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { ts } from "@ts-morph/bootstrap";
import { documentRange } from '../document-util';

export default class TemplateFoldingRangeProvider extends LanguageFeatureProviderBase implements vscode.FoldingRangeProvider {

    private htmlLanguageService: LanguageService = getLanguageService();
    
    provideFoldingRanges(document: vscode.TextDocument, context: vscode.FoldingContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {

        const allFoldingRanges: vscode.FoldingRange[] = [];
        
        // Anki template folding
        {
            const embeddedDocument = this.getEmbeddedByLanguage(document, TEMPLATE_LANGUAGE_ID);

            if (embeddedDocument) {
                const templateDocument = this.parseTemplateDocument(embeddedDocument.content);
                
                // Create folding ranges for linked conditional opening and closing tags
                const conditionalFoldingRanges = templateDocument.replacements
                    .filter((conditional): conditional is RequiredProp<ConditionalStart, "linkedTag"> =>
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
                    foldingRange.kind ? htmlFoldingRangeKindMap[foldingRange.kind] : undefined
                )));
        }

        // javascript folding
        {
            const embeddedJsDocument = this.getEmbeddedByLanguage(document, "javascript");
            if (embeddedJsDocument) {
                const fileName = embeddedJsDocument.virtualUri.toString();
                
                const jsSourceFile = this.embeddedHandler.tsProject.createSourceFile(
                    fileName,
                    embeddedJsDocument.content,
                    {
                        scriptKind: ts.ScriptKind.JS
                    }
                );

                const jsOutliningSpans = this.embeddedHandler.tsLanguageService.getOutliningSpans(fileName);

                this.embeddedHandler.tsProject.removeSourceFile(jsSourceFile);

                const jsFoldingRanges = jsOutliningSpans.map<vscode.FoldingRange>(outliningSpan => {
                    const { textSpan } = outliningSpan;
                    const range = documentRange(document, textSpan.start, textSpan.start + textSpan.length);
                    return new vscode.FoldingRange(range.start.line, range.end.line - 1, tsFoldingRangeKindMap[outliningSpan.kind]);
                });
                allFoldingRanges.push(...jsFoldingRanges);
            }
        }
        
        return allFoldingRanges;
    }

}

const htmlFoldingRangeKindMap: Record<string, vscode.FoldingRangeKind> = {
    [HtmlFoldingRangeKind.Comment]: vscode.FoldingRangeKind.Comment,
    [HtmlFoldingRangeKind.Imports]: vscode.FoldingRangeKind.Imports,
    [HtmlFoldingRangeKind.Region]: vscode.FoldingRangeKind.Region
} as const;

const tsFoldingRangeKindMap: Record<string, vscode.FoldingRangeKind> = {
    [ts.OutliningSpanKind.Comment]: vscode.FoldingRangeKind.Comment,
    [ts.OutliningSpanKind.Imports]: vscode.FoldingRangeKind.Imports,
    [ts.OutliningSpanKind.Region]: vscode.FoldingRangeKind.Region,
    [ts.OutliningSpanKind.Code]: vscode.FoldingRangeKind.Region
} as const;
