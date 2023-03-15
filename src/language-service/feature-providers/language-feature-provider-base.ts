import * as vscode from 'vscode';
import VirtualDocumentProvider, { EmbeddedDocument } from "../virtual-documents-provider";

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
        return this.virtualDocumentProvider.getEmbeddedByPosition(document, position);
    }

    protected getEmbeddedByLanguage(document: vscode.TextDocument, languageId: string): EmbeddedDocument | undefined {
        return this.virtualDocumentProvider.getEmbeddedByLanguage(document, languageId);
    }
    
}
