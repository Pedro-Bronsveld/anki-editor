import * as vscode from 'vscode';
import { getLanguageService, TokenType } from 'vscode-html-languageservice';

export type EmbeddedDocument = {
    languageId: string,
    content: string,
    virtualUri: vscode.Uri
}

export const getEmbbeddedDocument = (document: vscode.TextDocument, position: vscode.Position): EmbeddedDocument => {
    
    const embeddedContent = getEmbeddedContent(document, position);

    const virtualUri = createVirtualUri(embeddedContent.languageId, embeddedContent.fileExtension, document.uri);

    return {
        languageId: embeddedContent.languageId,
        content: embeddedContent.content,
        virtualUri,
    }
}

export const createVirtualUri = (languageId: string, fileExtension: string, originalUri: vscode.Uri) => 
    vscode.Uri.parse(`anki-editor-embedded:/${languageId}${originalUri.path}.${fileExtension}`);

interface EmbeddedContent {
	languageId: string;
    fileExtension: string;
    content: string;
}

/**
 * Extract a language id, file extension and content string from a given html document at a position.
 *
 * @param {vscode.TextDocument} document
 * @param {vscode.Position} position
 * @returns {EmbeddedContent}
 */
const getEmbeddedContent = (document: vscode.TextDocument, position: vscode.Position): EmbeddedContent => {
    const htmlLanguageService = getLanguageService();
	const scanner = htmlLanguageService.createScanner(document.getText());
    const offset = document.offsetAt(position);

    let token = scanner.scan();
	while (token !== TokenType.EOS) {
		switch (token) {
			case TokenType.Script:
				if (offset >= scanner.getTokenOffset() && offset <= scanner.getTokenEnd()) {
                    return {
                        languageId: "javascript",
                        fileExtension: "js",
                        content: blankOutSurrounding(document.getText(), scanner.getTokenOffset(), scanner.getTokenEnd())
                    }
				}
		}
		token = scanner.scan();
	}

    return {
        languageId: "html",
        fileExtension: "html",
        content: document.getText()
    }
}

const blankOutSurrounding = (content: string, start: number, end: number) => 
    content.slice(0, start).replace(/[^\n\r]/g, " ") +
    content.slice(start, end) + 
    content.slice(end).replace(/[^\n\r]/g, " ");
