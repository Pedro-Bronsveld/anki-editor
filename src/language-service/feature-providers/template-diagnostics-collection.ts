import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { getCSSLanguageService, TextDocument as CssTextDocument } from 'vscode-css-languageservice';
import VirtualDocumentProvider from '../virtual-documents-provider';
import { createProjectSync, Project, ts } from "@ts-morph/bootstrap";
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { parseTemplateDocument } from '../parser/template-parser';
import { AstItemType } from '../parser/ast-models';
import { specialFields } from '../anki-builtin';
import { isBackSide } from '../template-util';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { uriPathToParts } from '../../note-types/uri-parser';

export default class TemplateDiagnosticsProvider extends LanguageFeatureProviderBase {

    private cssLanguageService = getCSSLanguageService();
    private project: Project;
    private tsLanguageService: ts.LanguageService;
    private collection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('anki');

    private severityMap = {
        [ts.DiagnosticCategory.Warning]: vscode.DiagnosticSeverity.Warning,
        [ts.DiagnosticCategory.Error]: vscode.DiagnosticSeverity.Error,
        [ts.DiagnosticCategory.Suggestion]: vscode.DiagnosticSeverity.Hint,
        [ts.DiagnosticCategory.Message]: vscode.DiagnosticSeverity.Information
    } as const;

    constructor(virtualDocumentProvider: VirtualDocumentProvider, private ankiModelDataProvider: AnkiModelDataProvider) {
        super(virtualDocumentProvider);

        this.project = createProjectSync({
            useInMemoryFileSystem: true,
            compilerOptions: {
                allowJs: true,
                checkJs: true
            }
        });

        this.tsLanguageService = this.project.getLanguageService();
    }
    
    async updateDiagnostics(document: vscode.TextDocument): Promise<void> {
        
        if (document.languageId !== TEMPLATE_LANGUAGE_ID) {
            this.collection.clear();
            return;
        }

        const allDiagnostics: vscode.Diagnostic[] = [];

        const templateEmbeddedDocument = this.getEmbeddedByLanguage(document, TEMPLATE_LANGUAGE_ID);
        if (templateEmbeddedDocument) {
            // anki template
            const templateDocument = parseTemplateDocument(templateEmbeddedDocument.content);

            const validFields: Set<string> = new Set();
            const modelAvailable: boolean = document.uri.scheme === ANKI_EDITOR_SCHEME_BASE;
            let modelName = "";

            if (modelAvailable) {
                specialFields.forEach(validFields.add, validFields);
                if (isBackSide(document))
                    validFields.add("FrontSide");
                const uriParts = uriPathToParts(document.uri);
                if (uriParts.length >= 2) {
                    modelName = uriParts[1];
                    (await this.ankiModelDataProvider.getFieldNames(modelName)).forEach(validFields.add, validFields);
                }
            }

            for (const replacement of templateDocument.replacements) {

                // Check for invalid characters
                const invalidCharsMatches = [...replacement.content.substring(2, replacement.content.length - 2).matchAll(/["{}]/g)];
                allDiagnostics.push(...invalidCharsMatches.map(match =>
                    matchToDiagnostic(document, match, 2 + replacement.start, `${match[0]} is not a valid character inside a template replacement.`)
                ));
                
                // Check if field exists in model
                const { field } = replacement.fieldSegment;
                if (modelAvailable && field && !validFields.has(field.content)) {
                    // Provide diagnostics based on field names from model
                    allDiagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(document.positionAt(field.start), document.positionAt(field.end)),
                        `"${field.content}" is not a field name in note type "${modelName}".`));
                }

                {
                    // Invalid field character matching
                    const invalidStartCharMatch = replacement.fieldSegment.content.match(/^[#^/]+/);
                    if (invalidStartCharMatch)
                        allDiagnostics.push(matchToDiagnostic(document, invalidStartCharMatch, replacement.fieldSegment.start, "A field name can't start with '#', '^' or '/'."));
                }
                
                if (replacement.type === AstItemType.replacement) {
                    // Provide diagnostics for standard replacement
                    const invalidStartSpaceMatch = replacement.fieldSegment.content.match(/^\s+/);
                    if (invalidStartSpaceMatch && replacement.filterSegments.length > 0)
                        allDiagnostics.push(matchToDiagnostic(document, invalidStartSpaceMatch, replacement.fieldSegment.start, "A field name can't be preceded by a space when the replacement contains ':' characters."));
                    
                    for (const [i, filterSegment] of replacement.filterSegments.entries()) {

                        // Check for invalid spacing at the start of filter segment
                        const startSpaceMatch = filterSegment.content.match(/^\s+/);
                        if (i > 0 && startSpaceMatch)
                            allDiagnostics.push(matchToDiagnostic(document, startSpaceMatch, filterSegment.start, "Consecutive filters can't start with a space."));

                        // Check for invalid spacing at the end of filter segment
                        const endSpaceMatch = filterSegment.content.match(/\s+$/g)
                        if (endSpaceMatch && filterSegment.filter?.content !== "tts")
                            allDiagnostics.push(matchToDiagnostic(document, endSpaceMatch, filterSegment.end - endSpaceMatch[0].length, "Filters can't end with a space."));
                        
                        // Diagnostics for tts filter
                        const { filter } = filterSegment;
                        if (filter?.content === "tts") {
                            const arg0 = filter.arguments[0];

                            // Check if the first argument of the tts filter is the language argument
                            if (arg0?.type === AstItemType.filterArgumentKeyValue) {
                                allDiagnostics.push(new vscode.Diagnostic(
                                    new vscode.Range(document.positionAt(arg0.start), document.positionAt(arg0.end)),
                                    "The tts filter name must be followed be a language code such as 'en_US'.\nThe key value arguments 'voices' and 'speed' can only be used after this first argument."
                                ));
                            }
                            
                            // Check if there is more than one space between the tts filter name and the language argument
                            if (arg0?.type === AstItemType.filterArgument && arg0.start - filter.end > 1) {
                                allDiagnostics.push(new vscode.Diagnostic(
                                    new vscode.Range(document.positionAt(filter.end + 1), document.positionAt(arg0.start)),
                                    "There must be exactly one space between the tts filtername and the language argument."
                                ));
                            }
                        }
                    }
                }
                else if (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) {
                    // Provide error diagnostic for filter syntax in a conditional replacement
                    const invalidFilterMatch = replacement.fieldSegment.content.match(/.*:/);
                    if (invalidFilterMatch)
                        allDiagnostics.push(matchToDiagnostic(document, invalidFilterMatch, replacement.fieldSegment.start, "Filters are not allowed in conditional opening or closing tags."));
                }
                
            }
            
        }

        const cssEmbeddedDocument = this.getEmbeddedByLanguage(document, "css");
        if (cssEmbeddedDocument) {
            // css    
            const cssDocument = CssTextDocument.create(cssEmbeddedDocument.virtualUri.toString(), cssEmbeddedDocument.languageId, document.version, cssEmbeddedDocument.content);
            const stylesheet =this.cssLanguageService.parseStylesheet(cssDocument);
            const diagnostics = this.cssLanguageService.doValidation(cssDocument, stylesheet);

            // Map from css language service types to vscode types
            const transformedDiagnostics: vscode.Diagnostic[] = diagnostics.map(d => ({
                ...d,
                severity: d.severity ? d.severity - 1 : 3,
                range: new vscode.Range(
                    new vscode.Position(d.range.start.line, d.range.start.character), 
                    new vscode.Position(d.range.end.line, d.range.end.character)),
                relatedInformation: d.relatedInformation?.map(r => new vscode.DiagnosticRelatedInformation(
                    new vscode.Location(vscode.Uri.parse(r.location.uri), new vscode.Range(
                        new vscode.Position(r.location.range.start.line, r.location.range.start.character),
                        new vscode.Position(r.location.range.end.line, r.location.range.end.character))), r.message
                    )
                )
            }));

            allDiagnostics.push(...transformedDiagnostics);
        }

        const jsEmbeddedDocument = this.getEmbeddedByLanguage(document, "javascript");
        if (jsEmbeddedDocument){
            // javascript
            const fileName = jsEmbeddedDocument.virtualUri.toString();
            
            const jsSourceFile = this.project.createSourceFile(
                fileName,
                jsEmbeddedDocument.content,
                {
                    scriptKind: ts.ScriptKind.JS
                }
            );
            
            // Semantic diagnostics
            const semanticDiagnostics = this.tsLanguageService.getSemanticDiagnostics(fileName);
    
            const transformedSemanticDiagnostics: vscode.Diagnostic[] = this.transformTsDiagnostics(document, semanticDiagnostics);
    
            allDiagnostics.push(...transformedSemanticDiagnostics);

            // Syntactic diagnostics
            const syntacticDiagnistics = this.tsLanguageService.getSyntacticDiagnostics(fileName);

            const transformedSyntacticDiagnostics: vscode.Diagnostic[] = this.transformTsDiagnostics(document, syntacticDiagnistics);

            allDiagnostics.push(...transformedSyntacticDiagnostics);

            this.project.removeSourceFile(jsSourceFile);
            
        }

        this.collection.set(document.uri, allDiagnostics);
    }

    private transformTsDiagnostics = (document: vscode.TextDocument, tsDiagnostics: ts.Diagnostic[]): vscode.Diagnostic[] => 
        tsDiagnostics.map(dia => ({
            ...dia,
            range: new vscode.Range(
                document.positionAt(dia.start ?? 0),
                document.positionAt((dia.start ?? 0) + (dia.length ?? 0))
            ),
            message: typeof dia.messageText === "string" ? dia.messageText : this.flattenDiagnosticMessageChain(dia.messageText).join("\n"),
            severity: this.severityMap[dia.category],
            relatedInformation: dia.relatedInformation?.map(rel => ({
                ...rel,
                location: new vscode.Location(
                    document.uri,
                    new vscode.Range(
                        document.positionAt(rel.start ?? 0),
                        document.positionAt((rel.start ?? 0) + (rel.length ?? 0)))
                ),
                message: typeof rel.messageText === "string" 
                    ? rel.messageText
                    : this.flattenDiagnosticMessageChain(rel.messageText).join("\n"),
            }))
        }));

    private flattenDiagnosticMessageChain = (chain: ts.DiagnosticMessageChain): ts.DiagnosticMessageChain[] =>
        [chain].concat(chain.next ? chain.next.flatMap(this.flattenDiagnosticMessageChain) : []);
    
}

const matchToDiagnostic = (document: vscode.TextDocument, match: RegExpMatchArray, offset: number, message: string): vscode.Diagnostic => new vscode.Diagnostic(
    new vscode.Range(document.positionAt(offset + (match.index ?? 0)), document.positionAt(offset + (match.index ?? 0) + match[0].length)),
    message
);
