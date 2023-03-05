import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { conditionalChar } from '../parser/ast-utils';
import { AstItemType, ConditionalStart, FilterSegment, Replacement, StandardReplacement } from '../parser/ast-models';
import { parseTemplateDocument } from '../parser/template-parser';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { documentRange } from '../document-util';

export default class TemplateSymbolProvider extends LanguageFeatureProviderBase implements vscode.DocumentSymbolProvider {
    
    async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[] | null | undefined> {

        const allDocumentSymbols: vscode.DocumentSymbol[] = [];

        // Anki template symbols
        {
            const embeddedDocument = this.getEmbeddedByLanguage(document, TEMPLATE_LANGUAGE_ID);

            if (embeddedDocument) {
                const templateDocument = parseTemplateDocument(embeddedDocument.content);

                // Create document symbols for top-level replacements (replacements without a parent conditional)
                const templateDocumentSymbols = templateDocument.replacements
                    .filter((replacement): replacement is StandardReplacement | ConditionalStart =>
                        replacement.parentConditional === undefined &&
                        replacement.type !== AstItemType.conditionalEnd)
                    .map(replacement => createDocumentSymbol(document, replacement));

                allDocumentSymbols.push(...templateDocumentSymbols);
            }
        }
        
        // html symbols
        {
            const embeddedDocument = this.getEmbeddedByLanguage(document, "html");
            console.log("symbols");
            if (!embeddedDocument)
                return;
            
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                embeddedDocument.virtualUri
            );
            
            const flattenedSymbols = this.flattenSymbols(symbols);

            allDocumentSymbols.push(...flattenedSymbols);
        }

    return allDocumentSymbols;
    }

    private flattenSymbols(documentSymbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
        return documentSymbols.flatMap(docSymbol => [docSymbol, ...this.flattenSymbols(docSymbol.children)]);
    }

}

const createDocumentSymbol = (document: vscode.TextDocument, replacement: StandardReplacement | ConditionalStart): vscode.DocumentSymbol => {
    
    // Recursively create document symbols of child replacements
    const children: vscode.DocumentSymbol[] = replacement.type === AstItemType.conditionalStart
        ? replacement.childReplacements
            .filter((childReplacement): childReplacement is StandardReplacement | ConditionalStart => childReplacement.type !== AstItemType.conditionalEnd)
            .map(childReplacement => createDocumentSymbol(document, childReplacement))
        : [];
    
    const name = (replacement.type === AstItemType.replacement
        ? replacement.filterSegments
            .filter((filterSegment): filterSegment is FilterSegment & Required<Pick<FilterSegment, "filter">> => filterSegment.filter !== undefined)
            .map(filterSegment => filterSegment.filter.content + ":")
            .join("")
        : conditionalChar(replacement)) +
        (replacement.fieldSegment.field?.content ?? "<Missing Field>");

    const range = documentRange(document, replacement.start,
        replacement.type === AstItemType.conditionalStart && replacement.linkedTag
            ? replacement.linkedTag.end
            : replacement.end)
    
    const documentSymbol = new vscode.DocumentSymbol(
        name,
        "",
        replacement.type === AstItemType.replacement
            ? vscode.SymbolKind.Field
            : vscode.SymbolKind.Object,
        range,
        range);
    
    documentSymbol.children = children;

    return documentSymbol;
}
