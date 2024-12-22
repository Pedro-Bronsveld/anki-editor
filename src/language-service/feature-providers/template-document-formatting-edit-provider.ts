import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import EmbeddedHandler from '../embedded-handler';
import VirtualDocumentProvider from '../virtual-documents-provider';
import { escapeTemplateRegions, unescapeTemplateRegions } from '../escape-html';
import { getReplacementTemplateLanguageRegions } from '../language-regions';
import { createVirtualUri } from './embedded-functions';

export default class TemplateDocumentFormattingEditProvider extends LanguageFeatureProviderBase implements vscode.DocumentFormattingEditProvider {

    constructor(embeddedHandler: EmbeddedHandler, private virtualDocumentProvider: VirtualDocumentProvider) {
        super(embeddedHandler)
    }

    async provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Promise<vscode.TextEdit[] | null | undefined> {
        
        const embeddedDocument = this.getEmbeddedByLanguage(document, "html");

        if (!embeddedDocument)
            return;

        // escape certain html characters before sending the document to VSCode's document format provider
        const templateRegions = getReplacementTemplateLanguageRegions(embeddedDocument.content, false);
        const escapedDocumentContent = escapeTemplateRegions(embeddedDocument.content, templateRegions);

        const escapedDocumentUri = createVirtualUri("html-escaped", "html", embeddedDocument.virtualUri);
        this.virtualDocumentProvider.setDocumentContent(escapedDocumentUri, escapedDocumentContent);

        const formatTextEdits: vscode.TextEdit[] = [];
        try {
            formatTextEdits.push(...await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                escapedDocumentUri,
                options
            ));
        }
        catch (error) {
            throw error;
        }
        finally {
            this.virtualDocumentProvider.deleteUri(escapedDocumentUri);
        }
        
        // unescape replacement templates content in text edits
        formatTextEdits.forEach(formatTextEdit => {
            const textEditContent = formatTextEdit.newText;
            const formattedTemplateRegions = getReplacementTemplateLanguageRegions(textEditContent, false);
            const unescapedTextEditContent = unescapeTemplateRegions(textEditContent, formattedTemplateRegions);
            formatTextEdit.newText = unescapedTextEditContent;
        });

        return formatTextEdits;
    }

}