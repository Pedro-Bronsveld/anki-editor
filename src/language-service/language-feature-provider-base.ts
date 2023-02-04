import * as vscode from 'vscode';
import { EmbeddedDocument, getEmbbeddedDocument } from './embedded-document';
import VirtualDocumentProvider from "./virtual-documents-provider";

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
    protected getEmbedded(document: vscode.TextDocument, position: vscode.Position): EmbeddedDocument {
        const embeddedDocument = getEmbbeddedDocument(document, position);
        this.virtualDocumentProvider.setDocumentContent(embeddedDocument.virtualUri, embeddedDocument.content);
        return embeddedDocument;
    }
    
}
