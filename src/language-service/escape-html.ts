import { LanguageRegion, replaceRange } from "./language-regions";

// https://stackoverflow.com/a/6234804
export const escapeHtml = (html: string) => html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#47;");

export const unescapeHtml = (escapedHtml: string) => escapedHtml
    .replace(/&#47;/g, "\/")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/"&amp;"/g, "&");

const convertTemplateRegions = (inputHtmlContent: string, templateRegions: LanguageRegion[], escape: boolean): string => {
    const outputHtmlContent = templateRegions.reduce((accumulated, templateRegion) => {
        const templateRegionContent = templateRegion.blankSurroundings
            ? templateRegion.content.substring(templateRegion.start, templateRegion.end)
            : templateRegion.content;
        
        const convertedRegionContent = escape
            ? escapeHtml(templateRegionContent)
            : unescapeHtml(templateRegionContent);

        const newHtml = replaceRange(accumulated.html, templateRegion.start + accumulated.offset, templateRegion.end + accumulated.offset, convertedRegionContent);
        const newOffset = accumulated.offset + (convertedRegionContent.length - templateRegionContent.length);

        return { html: newHtml, offset: newOffset };
    }, {
        html: inputHtmlContent,
        offset: 0
    });

    return outputHtmlContent.html;
}

export const escapeTemplateRegions = (inputHtmlContent: string, templateRegions: LanguageRegion[]): string =>
    convertTemplateRegions(inputHtmlContent, templateRegions, true);

export const unescapeTemplateRegions = (inputHtmlContent: string, templateRegions: LanguageRegion[]): string =>
    convertTemplateRegions(inputHtmlContent, templateRegions, false);
