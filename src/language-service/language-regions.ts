import * as vscode from 'vscode';
import { getLanguageService, TokenType } from 'vscode-html-languageservice';
import { ANKI_EDITOR_EMBEDDED_SCHEME, TEMPLATE_EXTENSION, TEMPLATE_LANGUAGE_ID } from '../constants';
import { getReplacementMatches } from './parser/template-parser';

export interface LanguageRegion {
    languageId: string;
    fileExtension: string;
    content: string;
    start: number;
    end: number;
}

export const createVirtualUri = (languageId: string, fileExtension: string, originalUri: vscode.Uri) => 
    vscode.Uri.parse(`${ANKI_EDITOR_EMBEDDED_SCHEME}${languageId}${originalUri.path}.${fileExtension}`);

export const getLanguageRegions = (document: vscode.TextDocument): LanguageRegion[] => {
    const htmlLanguageService = getLanguageService();
    const documentText = document.getText();
    const languageRegions: LanguageRegion[] = [];

    // extract anki-template regions
    const replacementMatches = getReplacementMatches(documentText);

    const templateRegions = replacementMatches
        .map<LanguageRegion>(({ 0: text, index }) => 
            ({
                languageId: TEMPLATE_LANGUAGE_ID,
                fileExtension: TEMPLATE_EXTENSION,
                content: blankOutSurrounding(documentText, index ?? 0, (index ?? 0) + text.length),
                start: index ?? 0,
                end: (index ?? 0) + text.length
            })
        );
    languageRegions.push(...templateRegions);

    // Remove template regions from document before extracing javascript and css
    const clearedDocument = blankOutLanguageRegions(documentText, templateRegions);
	
    // extract javascript and css regions
    const scanner = htmlLanguageService.createScanner(clearedDocument);
    let token = scanner.scan();
	while (token !== TokenType.EOS) {
		switch (token) {
			case TokenType.Script:
                languageRegions.push({
                    languageId: "javascript",
                    fileExtension: "js",
                    content: blankOutSurrounding(clearedDocument, scanner.getTokenOffset(), scanner.getTokenEnd()),
                    start: scanner.getTokenOffset(),
                    end: scanner.getTokenEnd()
                });
                break;
            case TokenType.Styles:
                languageRegions.push({
                    languageId: "css",
                    fileExtension: "css",
                    content: blankOutSurrounding(clearedDocument, scanner.getTokenOffset(), scanner.getTokenEnd()),
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

export const combineLanguageRegionsById = (languageRegions: LanguageRegion[]): LanguageRegion[] => 
    Array.from(languageRegions.reduce((output, region) => {
        output.get(region.languageId)?.push(region) ?? output.set(region.languageId, [region]);
        return output;
    }, new Map<string, LanguageRegion[]>()))
    .map<LanguageRegion>(([languageId, regions]) => 
    ({
        languageId,
        fileExtension: regions[0].fileExtension,
        content: regions.slice(1).reduce((outputContent, region) => 
            replaceRange(outputContent, region.start, region.end, region.content.substring(region.start, region.end)), regions[0].content),
        start: regions[0].start,
        end: regions[regions.length-1].end
    }));

export const defaultLanguageRegion = (document: vscode.TextDocument): LanguageRegion => {
    const htmlContent = document.getText();
    return {
        languageId: "html",
        fileExtension: "html",
        content: htmlContent,
        start: 0,
        end: htmlContent.length 
    }
}

const blankOutRegexp = /[^\n\r]/g;

const blankOutLanguageRegions = (content: string, languageRegions: LanguageRegion[]): string =>
    languageRegions.reduce((output, region) => blankOutRange(output, region.start, region.end), content);

const blankOutRange = (content: string, start: number, end: number): string =>
    replaceRange(content, start, end, content.slice(start, end).replace(blankOutRegexp, " "));

const blankOutSurrounding = (content: string, start: number, end: number): string => 
    content.slice(0, start).replace(blankOutRegexp, " ") +
    content.slice(start, end) + 
    content.slice(end).replace(blankOutRegexp, " ");

const replaceRange = (text: string, start: number, end: number, substitute: string): string =>
    text.substring(0, start) + substitute + text.substring(end);
