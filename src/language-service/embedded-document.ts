import * as vscode from 'vscode';
import { getLanguageService, TokenType } from 'vscode-html-languageservice';

export interface LanguageRegion {
    languageId: string;
    fileExtension: string;
    content: string;
    start: number;
    end: number;
}

export const createVirtualUri = (languageId: string, fileExtension: string, originalUri: vscode.Uri) => 
    vscode.Uri.parse(`anki-editor-embedded:/${languageId}${originalUri.path}.${fileExtension}`);

/**
 * Extract a language id, file extension and content string from a given html document at a position.
 *
 * @param {vscode.TextDocument} document
 * @param {vscode.Position} position
 * @returns {EmbeddedContent}
 */
export const getLanguageRegionAtPosition = (document: vscode.TextDocument, position: vscode.Position): LanguageRegion => {
    const languageRegions = getLanguageRegions(document);
    const offset = document.offsetAt(position);

    for (const region of languageRegions) {
        if (offset >= region.start && offset <= region.end)
            return region;
    }

    return defaultLanguageRegion(document);
}

export const getLanguageRegionByLanguage = (document: vscode.TextDocument, languageId: string): LanguageRegion | undefined => {
    const languageRegions = getLanguageRegions(document);
    
    for (const region of languageRegions) {
        if (region.languageId === languageId)
            return region;
    }

    return undefined
}

const getLanguageRegions = (document: vscode.TextDocument): LanguageRegion[] => {
    const htmlLanguageService = getLanguageService();
	const scanner = htmlLanguageService.createScanner(document.getText());

    const languageRegions: LanguageRegion[] = [];

    let token = scanner.scan();
	while (token !== TokenType.EOS) {
		switch (token) {
			case TokenType.Script:
                languageRegions.push({
                    languageId: "javascript",
                    fileExtension: "js",
                    content: blankOutSurrounding(document.getText(), scanner.getTokenOffset(), scanner.getTokenEnd()),
                    start: scanner.getTokenOffset(),
                    end: scanner.getTokenEnd()
                });
                break;
            case TokenType.Styles:
                languageRegions.push({
                    languageId: "css",
                    fileExtension: "css",
                    content: blankOutSurrounding(document.getText(), scanner.getTokenOffset(), scanner.getTokenEnd()),
                    start: scanner.getTokenOffset(),
                    end: scanner.getTokenEnd()
                });
                break;
		}
		token = scanner.scan();
	}

    languageRegions.push(defaultLanguageRegion(document));

    return languageRegions;
}

const defaultLanguageRegion = (document: vscode.TextDocument): LanguageRegion => {
    const htmlContent = document.getText();
    return {
        languageId: "html",
        fileExtension: "html",
        content: htmlContent,
        start: 0,
        end: htmlContent.length 
    }
}

const blankOutSurrounding = (content: string, start: number, end: number) => 
    content.slice(0, start).replace(/[^\n\r]/g, " ") +
    content.slice(start, end) + 
    content.slice(end).replace(/[^\n\r]/g, " ");
