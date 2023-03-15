import * as vscode from 'vscode';
import { combineLanguageRegionsById, createVirtualUri, defaultLanguageRegion, getLanguageRegions, LanguageRegion } from './language-regions';

export default class VirtualDocumentProvider implements vscode.TextDocumentContentProvider {
    private documents = new Map<string, string>();

    constructor() {}
    
    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        return this.documents.get(uri.toString());
    }

    setDocumentContent(uri: vscode.Uri, document: string) {
        this.documents.set(uri.toString(), document);
    }

    clear() {
        this.documents.clear();
    };

    /**
     * Gets the embedded contents of a given document at a position and stores it in the VirtualDocumentProvider.
     *
     * @protected
     * @param {vscode.TextDocument} document
     * @param {vscode.Position} position
     * @returns {EmbeddedDocument}
     * @memberof TemplateBaseProvider
     */
    public getEmbeddedByPosition(document: vscode.TextDocument, position: vscode.Position): EmbeddedDocument {
        const languageRegions = getLanguageRegions(document);
        const offset = document.offsetAt(position);
    
        const positionRegion = languageRegions.find(region => offset >= region.start && offset <= region.end)
    
        if (!positionRegion)
            return this.toEmbeddedDocument(defaultLanguageRegion(document), document.uri);
    
        const resultRegion = combineLanguageRegionsById(languageRegions).find(region => region.languageId === positionRegion.languageId);
        
        return this.toEmbeddedDocument(resultRegion ?? defaultLanguageRegion(document), document.uri);
    }

    public getEmbeddedByLanguage(document: vscode.TextDocument, languageId: string): EmbeddedDocument | undefined {
        const languageRegions = getLanguageRegions(document);

        const combinedLanguageRegions = combineLanguageRegionsById(languageRegions);

        const languageRegion = combinedLanguageRegions.find(region => region.languageId === languageId);

        if (!languageRegion)
            return undefined;

        return this.toEmbeddedDocument(languageRegion, document.uri);
    }

    private toEmbeddedDocument(region: LanguageRegion, originalUri: vscode.Uri): EmbeddedDocument {
        const virtualUri = createVirtualUri(region.languageId, region.fileExtension, originalUri);
        this.setDocumentContent(virtualUri, region.content);
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
