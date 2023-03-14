import * as vscode from 'vscode';
import { combineLanguageRegionsById, createVirtualUri, defaultLanguageRegion, getLanguageRegions, LanguageRegion } from '../language-regions';
import VirtualDocumentProvider from "../virtual-documents-provider";

export default abstract class LanguageFeatureProviderBase {

    constructor(protected virtualDocumentProvider: VirtualDocumentProvider) {}

    /**
     * Gets the embedded contents of a given document at a position and stores it in the VirtualDocumentProvider.
     *
     * @protected
     * @param {vscode.TextDocument} document
     * @param {vscode.Position} position
     * @returns {EmbeddedDocument}
     * @memberof TemplateBaseProvider
     */
    protected getEmbeddedByPosition(document: vscode.TextDocument, position: vscode.Position): EmbeddedDocument {
        const languageRegions = getLanguageRegions(document);
        const offset = document.offsetAt(position);
    
        const positionRegion = languageRegions.find(region => offset >= region.start && offset <= region.end)
    
        if (!positionRegion)
            return this.toEmbeddedDocument(defaultLanguageRegion(document), document.uri);
    
        const resultRegion = combineLanguageRegionsById(languageRegions).find(region => region.languageId === positionRegion.languageId);
        
        return this.toEmbeddedDocument(resultRegion ?? defaultLanguageRegion(document), document.uri);
    }

    protected getEmbeddedByLanguage(document: vscode.TextDocument, languageId: string): EmbeddedDocument | undefined {
        const languageRegions = getLanguageRegions(document);

        const combinedLanguageRegions = combineLanguageRegionsById(languageRegions);

        const languageRegion = combinedLanguageRegions.find(region => region.languageId === languageId);

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
