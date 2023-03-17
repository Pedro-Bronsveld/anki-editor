import { createProjectSync, Project, ts } from '@ts-morph/bootstrap';
import * as vscode from 'vscode';
import { getCSSLanguageService } from 'vscode-css-languageservice';
import { createCachedFunction } from "../cache/cached-function";
import { EmbeddedDocument } from '../models/embedded-document';
import { embeddedLanguages, LanguageId } from '../models/embedded-languages';
import { objectEntries } from '../util/object-utilities';
import { createVirtualUri } from './feature-providers/embedded-functions';
import { combineLanguageRegionsById, defaultLanguageRegion, getLanguageRegions, LanguageRegion } from './language-regions';
import { parseTemplateDocument } from './parser/template-parser';
import VirtualDocumentProvider from "./virtual-documents-provider";

export default class EmbeddedHandler {

    public readonly cssLanguageService = getCSSLanguageService();
    public readonly tsProject: Project;
    public readonly tsLanguageService: ts.LanguageService;

    constructor(private virtualDocumentProvider: VirtualDocumentProvider) {

        this.tsProject = createProjectSync({
            useInMemoryFileSystem: true,
            compilerOptions: {
                allowJs: true,
                checkJs: true
            }
        });

        this.tsLanguageService = this.tsProject.getLanguageService();

    }
    
    public clearCache(document?: vscode.TextDocument) {
        const cachedFunctions = [
            this.getEmbeddedByPosition,
            this.getEmbeddedByLanguage,
            this.getLanguageRegions
        ] as const;
        
        if (document)
            // Clear only the given document from cache
            objectEntries(embeddedLanguages)
            .map(([languageId, fileExtension]) => createVirtualUri(languageId, fileExtension, document.uri))
            .forEach(uri => {
                    const uriString = uri.toString();
                    if (uriString.endsWith(".js"))
                        this.tsProject.removeSourceFile(uriString);
                    cachedFunctions.forEach(cachedFunction => cachedFunction
                        .clearCacheWhere(({ args: [cachedDocument] }) => cachedDocument.uri.toString() === uriString)
                    );
                    this.virtualDocumentProvider.deleteUri(uri);
                }
            );
        else {
            // Clear all entries from caches
            cachedFunctions.forEach(cachedFunction => cachedFunction.clearCache());
            this.parseTemplateDocument.clearCache();
            this.virtualDocumentProvider.clear();
        }
    }
    
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
    
    public getEmbeddedByLanguage = createCachedFunction((document: vscode.TextDocument, languageId: LanguageId): EmbeddedDocument | undefined => {
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

    public parseTemplateDocument = createCachedFunction(parseTemplateDocument, {
        maxSize: 10
    });
    
}
