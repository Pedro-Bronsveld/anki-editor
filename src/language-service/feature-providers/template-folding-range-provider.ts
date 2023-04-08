import * as vscode from 'vscode';
import { getLanguageService, LanguageService, TextDocument, FoldingRangeKind as HtmlFoldingRangeKind } from 'vscode-html-languageservice';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { RequiredProp } from '../../models/required-prop';
import { AstItemType, ConditionalStart, StandardReplacement } from '../parser/ast-models';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { ts } from "@ts-morph/bootstrap";
import { documentRange, isMultiLineAstItem } from '../document-util';
import { TextDocument as CssTextDocument } from "vscode-css-languageservice";

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
                // and standard replacements stretching multiple lines.

                const foldableReplacements = templateDocument.replacements
                    .filter((replacement): replacement is RequiredProp<ConditionalStart, "linkedTag"> | StandardReplacement =>
                        replacement.type === AstItemType.conditionalStart &&
                        replacement.linkedTag !== undefined
                        ||
                        replacement.type === AstItemType.replacement &&
                        isMultiLineAstItem(document, replacement, 2));
                
                const templateFoldingRanges = foldableReplacements
                    .map(replacement =>
                        new vscode.FoldingRange(
                            document.positionAt(replacement.start).line,
                            document.positionAt(
                                replacement.type === AstItemType.conditionalStart
                                    ? replacement.linkedTag.start
                                    : replacement.end
                                ).line - 1
                        )
                    );
                
                allFoldingRanges.push(...templateFoldingRanges);
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
                // javascript parsing
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

                // Get javascript folding ranges
                const jsFoldingRanges = jsOutliningSpans.map<vscode.FoldingRange>(outliningSpan => {
                    const { textSpan } = outliningSpan;
                    const range = documentRange(document, textSpan.start, textSpan.start + textSpan.length);
                    return new vscode.FoldingRange(range.start.line, range.end.line - 1, tsFoldingRangeKindMap[outliningSpan.kind]);
                });
                allFoldingRanges.push(...jsFoldingRanges);
            }
        }

        // CSS folding
        {
            const embeddedCssDocument = this.getEmbeddedByLanguage(document, "css");
            if (embeddedCssDocument) {
                // CSS Parsing
                const cssTextDocument = CssTextDocument.create(embeddedCssDocument.virtualUri.toString(), document.languageId, document.version, embeddedCssDocument.content);

                // Get CSS folding ranges
                const cssFoldingRanges = this.embeddedHandler.cssLanguageService.getFoldingRanges(cssTextDocument);
                const vscodeFoldingRanges = cssFoldingRanges.map<vscode.FoldingRange>(cssFoldingRange => new vscode.FoldingRange(cssFoldingRange.startLine, cssFoldingRange.endLine));

                allFoldingRanges.push(...vscodeFoldingRanges);
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
