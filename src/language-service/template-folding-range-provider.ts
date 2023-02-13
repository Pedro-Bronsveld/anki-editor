import * as vscode from 'vscode';
import { getLanguageService, LanguageService, TextDocument, FoldingRangeKind } from 'vscode-html-languageservice';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateFoldingRangeProvider extends LanguageFeatureProviderBase implements vscode.FoldingRangeProvider {

    private htmlLanguageService: LanguageService = getLanguageService();
    
    provideFoldingRanges(document: vscode.TextDocument, context: vscode.FoldingContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {

        const htmlTextDocument = TextDocument.create(document.uri.toString(), "html", document.version, document.getText());
        
        const foldingRanges = this.htmlLanguageService.getFoldingRanges(htmlTextDocument, context);
        
        const transformedFoldingRanges: vscode.FoldingRange[] = foldingRanges.map(foldingRange => 
            new vscode.FoldingRange(
                document.offsetAt(new vscode.Position(foldingRange.startLine, foldingRange.startCharacter ?? 0)),
                document.offsetAt(new vscode.Position(foldingRange.endLine, foldingRange.endCharacter ?? 0)),
                foldingRange.kind ? foldingRangeKindMap[foldingRange.kind] : undefined
            ));
        
        return transformedFoldingRanges;
    }

}

const foldingRangeKindMap: Record<string, vscode.FoldingRangeKind> = {
    [FoldingRangeKind.Comment]: vscode.FoldingRangeKind.Comment,
    [FoldingRangeKind.Imports]: vscode.FoldingRangeKind.Imports,
    [FoldingRangeKind.Region]: vscode.FoldingRangeKind.Region
} as const;
