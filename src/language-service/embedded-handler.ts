import * as vscode from 'vscode';
import { createCachedFunction } from "../cache/cached-function";
import { EmbeddedDocument } from '../models/embedded-document';
import { combineLanguageRegionsById, createVirtualUri, defaultLanguageRegion, getLanguageRegions, LanguageRegion } from './language-regions';
import VirtualDocumentProvider from "./virtual-documents-provider";

export default class EmbeddedHandler {

    constructor(private virtualDocumentProvider: VirtualDocumentProvider) { }

    /**
     * Gets the embedded contents of a given document at a position and stores it in the VirtualDocumentProvider.
     *
     * @protected
     * @param {vscode.TextDocument} document
     * @param {vscode.Position} position
     * @returns {EmbeddedDocument}
     * @memberof TemplateBaseProvider
     */
    public getEmbeddedByPosition = createCachedFunction((document: vscode.TextDocument, position: vscode.Position): EmbeddedDocument => {
        const languageRegions = this.getLanguageRegions(document);
        const offset = document.offsetAt(position);
    
        const positionRegion = languageRegions.find(region => offset >= region.start && offset <= region.end)
    
        if (!positionRegion)
            return this.toEmbeddedDocument(defaultLanguageRegion(document), document.uri);
    
        const resultRegion = combineLanguageRegionsById(languageRegions).find(region => region.languageId === positionRegion.languageId);
        
        return this.toEmbeddedDocument(resultRegion ?? defaultLanguageRegion(document), document.uri);
    }, {
        cacheKey: (document, position) => `${document.version},${document.offsetAt(position)},${document.uri}`,
        onCacheMiss: (cachedFuncion, [document]) => cachedFuncion.clearCacheWhere(({ args: [entryDocument] }) => entryDocument.uri.toString() === document.uri.toString()),
        maxSize: 10
    });
    
    public getEmbeddedByLanguage = createCachedFunction((document: vscode.TextDocument, languageId: string): EmbeddedDocument | undefined => {
        const languageRegions = this.getLanguageRegions(document);

        const combinedLanguageRegions = combineLanguageRegionsById(languageRegions);

        const languageRegion = combinedLanguageRegions.find(region => region.languageId === languageId);

        if (!languageRegion)
            return undefined;

        return this.toEmbeddedDocument(languageRegion, document.uri);
    }, {
        cacheKey: (document, languageId) => `${document.version},${languageId},${document.uri}`,
        onCacheMiss: (cachedFuncion, [document]) => cachedFuncion.clearCacheWhere(({ args: [entryDocument] }) => entryDocument.uri.toString() === document.uri.toString()),
        maxSize: 10
    });

    private toEmbeddedDocument(region: LanguageRegion, originalUri: vscode.Uri): EmbeddedDocument {
        const virtualUri = createVirtualUri(region.languageId, region.fileExtension, originalUri);
        this.virtualDocumentProvider.setDocumentContent(virtualUri, region.content);
        return {
            content: region.content,
            languageId: region.languageId,
            virtualUri
        };
    }

    private getLanguageRegions = createCachedFunction(getLanguageRegions, {
        cacheKey: (document) => `${document.version},${document.uri}`,
        onCacheMiss: (cachedFuncion, [document]) => cachedFuncion.clearCacheWhere(({ args: [entryDocument] }) => entryDocument.uri.toString() === document.uri.toString()),
        maxSize: 10
    });
    
}