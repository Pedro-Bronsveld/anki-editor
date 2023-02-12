import * as vscode from 'vscode';
import { getCSSLanguageService, TextDocument as CssTextDocument } from 'vscode-css-languageservice';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateDocumentColorProvider extends LanguageFeatureProviderBase implements vscode.DocumentColorProvider {

    private cssLanguageService = getCSSLanguageService();
    
    async provideDocumentColors(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.ColorInformation[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByLanguage(document, "css");

        if (!embeddedDocument)
            return;

        // Open document first, otherwise executeCommand doesn't resolve.
        const openedDocument = await vscode.workspace.openTextDocument(embeddedDocument.virtualUri);
        
        const colors = await vscode.commands.executeCommand<vscode.ColorInformation[]>(
            'vscode.executeDocumentColorProvider',
            embeddedDocument.virtualUri,
        );

        return colors;
    }

    provideColorPresentations(color: vscode.Color, context: { readonly document: vscode.TextDocument; readonly range: vscode.Range; }, token: vscode.CancellationToken): vscode.ColorPresentation[] | null | undefined {
        const embeddedDocument = this.getEmbeddedByLanguage(context.document, "css");

        if (!embeddedDocument)
            return;

        const cssDocument = CssTextDocument.create(embeddedDocument.virtualUri.toString(), embeddedDocument.languageId, context.document.version, embeddedDocument.content);        
        const stylesheet = this.cssLanguageService.parseStylesheet(cssDocument);

        
        const colorPresentations = this.cssLanguageService.getColorPresentations(cssDocument, stylesheet, color, context.range);

        const transformedColorPresentations: vscode.ColorPresentation[] = colorPresentations.map(presentation => ({
            ...presentation,
            textEdit: presentation.textEdit
                ? new vscode.TextEdit(
                    new vscode.Range(
                        new vscode.Position(presentation.textEdit.range.start.line, presentation.textEdit?.range.start.character),
                        new vscode.Position(presentation.textEdit.range.end.line, presentation.textEdit?.range.end.character)
                    ),
                    presentation.textEdit.newText
                )
                : undefined,
            additionalTextEdits: presentation.additionalTextEdits
                ? presentation.additionalTextEdits.map(textEdit => new vscode.TextEdit(
                    new vscode.Range(
                        new vscode.Position(textEdit.range.start.line, textEdit.range.start.character),
                        new vscode.Position(textEdit.range.end.line, textEdit.range.end.character)
                    ),
                    textEdit.newText))
                : undefined
        }));

        return transformedColorPresentations;
    }

}