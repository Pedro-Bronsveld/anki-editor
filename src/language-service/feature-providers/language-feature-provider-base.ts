import * as vscode from 'vscode';
import { createVirtualUri, getLanguageRegionAtPosition, getLanguageRegionByLanguage, LanguageRegion } from '../embedded-document';
import VirtualDocumentProvider from "../virtual-documents-provider";

export default abstract class LanguageFeatureProviderBase {

    constructor(protected virtualDocumentProvider: VirtualDocumentProvider) {}

    /**
     * Gets the embedded contents of a given document and stores it in the VirtualDocumentProvider.
     *
     * @protected
     * @param {vscode.TextDocument} document
     * @param {vscode.Position} position
     * @returns {EmbeddedDocument}
     * @memberof TemplateBaseProvider
     */
    protected getEmbeddedByPosition(document: vscode.TextDocument, position: vscode.Position): EmbeddedDocument {
        const languageRegion = getLanguageRegionAtPosition(document, position);

        return this.toEmbeddedDocument(languageRegion, document.uri);
    }

    protected getEmbeddedByLanguage(document: vscode.TextDocument, languageId: string): EmbeddedDocument | undefined {
        const languageRegion = getLanguageRegionByLanguage(document, languageId);

        if (!languageRegion)
            return undefined;

        return this.toEmbeddedDocument(languageRegion, document.uri);
    }

    private toEmbeddedDocument(region: LanguageRegion, originalUri: vscode.Uri): EmbeddedDocument {
        const virtualUri = createVirtualUri(region.languageId, region.fileExtension, originalUri);
        this.virtualDocumentProvider.setDocumentContent(virtualUri, region.content);
        return {
            content: region.content,
            languageId: region.languageId,
            virtualUri
        };
    }
    
}

export type EmbeddedDocument = {
    languageId: string,
    content: string,
    virtualUri: vscode.Uri
}
