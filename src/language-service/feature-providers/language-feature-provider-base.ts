import * as vscode from 'vscode';
import { EmbeddedDocument } from '../../models/embedded-document';
import { LanguageId } from '../../models/embedded-languages';
import EmbeddedHandler from '../embedded-handler';

export default abstract class LanguageFeatureProviderBase {

    constructor(protected embeddedHandler: EmbeddedHandler) { }

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
        return this.embeddedHandler.getEmbeddedByPosition(document, position);
    }

    protected getEmbeddedByLanguage(document: vscode.TextDocument, languageId: LanguageId): EmbeddedDocument | undefined {
        return this.embeddedHandler.getEmbeddedByLanguage(document, languageId);
    }

    protected parseTemplateDocument = this.embeddedHandler.parseTemplateDocument.bind(this.embeddedHandler);
    
}
