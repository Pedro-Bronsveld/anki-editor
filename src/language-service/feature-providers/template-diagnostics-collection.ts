import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { TextDocument as CssTextDocument, LanguageService as CSSLanguageService } from 'vscode-css-languageservice';
import { Project, ts } from "@ts-morph/bootstrap";
import { ANKI_EDITOR_CONFIG, ANKI_EDITOR_SCHEME_BASE, TEMPLATE_EXTENSION, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { AstItemType, StandardReplacement } from '../parser/ast-models';
import { ttsOptionsList, ttsOptions, builtinFiltersNames } from '../anki-builtin';
import { isBackSide } from '../template-util';
import AnkiModelDataProvider from '../anki-model-data-provider';
import { partsToUri, uriPathToParts } from '../../note-types/uri-parser';
import { DiagnosticCode } from '../diagnostic-codes';
import { conditionalStartChar, getParentConditionals, getUnavailableFieldNames } from '../parser/ast-utils';
import EmbeddedHandler from '../embedded-handler';
import { getExtendedFilterNames, getExtendedFilters, getExtendedSpecialFieldNames } from '../anki-custom';
import { isClozeReplacement } from '../cloze-fields';
import { objectEntries } from '../../util/object-utilities';
import { missingRequiredPrecedingFilter } from './preceding-filter';

export default class TemplateDiagnosticsProvider extends LanguageFeatureProviderBase {

    private cssLanguageService: CSSLanguageService;
    private tsProject: Project;
    private tsLanguageService: ts.LanguageService;
    private collection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection(TEMPLATE_LANGUAGE_ID);

    private severityMap = {
        [ts.DiagnosticCategory.Warning]: vscode.DiagnosticSeverity.Warning,
        [ts.DiagnosticCategory.Error]: vscode.DiagnosticSeverity.Error,
        [ts.DiagnosticCategory.Suggestion]: vscode.DiagnosticSeverity.Hint,
        [ts.DiagnosticCategory.Message]: vscode.DiagnosticSeverity.Information
    } as const;

    constructor(embeddedHandler: EmbeddedHandler, private ankiModelDataProvider: AnkiModelDataProvider) {
        super(embeddedHandler);

        this.tsProject = embeddedHandler.tsProject;
        this.tsLanguageService = embeddedHandler.tsLanguageService;
        this.cssLanguageService = embeddedHandler.cssLanguageService;
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
            const templateDocument = this.parseTemplateDocument(templateEmbeddedDocument.content);

            const config = vscode.workspace.getConfiguration(ANKI_EDITOR_CONFIG);

            const validFields: Set<string> = new Set();
            const modelAvailable: boolean = document.uri.scheme === ANKI_EDITOR_SCHEME_BASE;
            let modelName = "";
            const validFiltersMap = getExtendedFilters();
            const validFilterNames = getExtendedFilterNames();

            if (modelAvailable) {
                getExtendedSpecialFieldNames().forEach(validFields.add, validFields);
                const backSide = isBackSide(document)
                if (backSide)
                    validFields.add("FrontSide");
                const uriParts = uriPathToParts(document.uri);
                let cardName = "";
                if (uriParts.length >= 2) {
                    modelName = uriParts[1];
                    cardName = uriParts[2];
                    (await this.ankiModelDataProvider.getFieldNames(modelName)).forEach(validFields.add, validFields);
                }

                // For front sides, check if template is identical to front side of other card in the same note type
                if (!backSide && uriParts.length >= 2) {
                    const templates = await this.ankiModelDataProvider.ankiConnect.getModelTemplates(modelName);
                    const documentText = document.getText();
                    allDiagnostics.push(...objectEntries(templates)
                        .filter(([name, template]) => name !== cardName && template.Front === documentText)
                        .map(([name, ]) => {
                            const diagnostic = createDiagnostic(document, 0, 0,
                                `Template is identical to front side of card '${name}' in this note type.`);
                            
                            // Provide link to identical front side
                            diagnostic.relatedInformation = [new vscode.DiagnosticRelatedInformation(new vscode.Location(
                                    partsToUri([...uriParts.slice(0, 2), name, `Front${TEMPLATE_EXTENSION}`]),
                                    document.positionAt(0)
                                ), `identical front side in '${name}'.`)];
                            return diagnostic;
                        }));
                }
            }

            const modelProbablyCloze = modelAvailable && modelName !== "" && await this.ankiModelDataProvider.probablyCloze(modelName);

            // Check if a cloze template contains at least one standard replacement
            if (modelProbablyCloze && !templateDocument.replacements.some(replacement => replacement.type === AstItemType.replacement)) {
                allDiagnostics.push(createDiagnostic(document, 0, 0,
                    "No replacement with cloze filter found. A cloze template must contain at least one replacement with a cloze filter."));
            }

            for (const replacement of templateDocument.replacements) {
                
                // Check if this replacement contains a valid tts-voices filter
                const ttsVoicesFilterSegmentIndex = replacement.type === AstItemType.replacement
                    ? replacement.filterSegments
                        .findIndex((filterSegment, i) => filterSegment.filter?.content === "tts-voices"
                            && filterSegment.end === filterSegment.filter.end
                            && (i === 0 || i > 0 && filterSegment.filter.start === filterSegment.start))
                    : -1;
                const containsTtsVoicesFilter = ttsVoicesFilterSegmentIndex >= 0;

                // Check if replacement contains any filters that explicitly state a field is not required
                const fieldOptional = replacement.type === AstItemType.replacement &&
                    (replacement.filterSegments.some(({ filter }) => filter && validFiltersMap.get(filter.content)?.fieldRequired === false)
                    || !config.get("missingFieldDiagnostics"));

                // Check if field exists in model
                const { field } = replacement.fieldSegment;
                if (!field && !fieldOptional ) {
                    // Provide diagnostic for missing field name
                    allDiagnostics.push(createDiagnostic(document, replacement.fieldSegment.start, replacement.fieldSegment.end,
                        "Missing field name."));
                }
                else if (config.get("invalidFieldDiagnostics") && modelAvailable && field && 
                    !(validFields.has(field.content) || modelProbablyCloze && isClozeReplacement(replacement))) {
                    // Provide diagnostics based on field names from model
                    allDiagnostics.push(createDiagnostic(document, field.start, field.end,
                        field.content === "FrontSide"
                            ? "The special field 'FrontSide' can only be used on the back template of a card."
                            : `"${field.content}" is not a field name in note type "${modelName}" or a special field name.` +
                                (isClozeReplacement(replacement) && !modelProbablyCloze
                                ? "\n\nSpecial cloze fields such as \"c1\" can only be used in conditional tags on cloze note types."
                                : ""),
                        DiagnosticCode.invalidField));
                }

                {
                    // Invalid field character matching
                    const invalidStartCharMatch = replacement.fieldSegment.content.match(/^[#^/]+/);
                    if (invalidStartCharMatch)
                        allDiagnostics.push(matchToDiagnostic(document, invalidStartCharMatch, replacement.fieldSegment.start,
                            "A field name can't start with '#', '^' or '/'.",
                            DiagnosticCode.invalidCharacter));
                    
                    const invalidCharsMatches = [...replacement.fieldSegment.content.matchAll(/["{}]+/g)];
                    allDiagnostics.push(...invalidCharsMatches.map(match =>
                        matchToDiagnostic(document, match, replacement.fieldSegment.start,
                            `${match[0]} is not a valid character inside a field.`,
                            DiagnosticCode.invalidCharacter)
                    ));
                }
                
                if (replacement.type === AstItemType.replacement) {
                    // Provide diagnostics for standard replacement

                    // Check if cloze template contains at least one cloze filter
                    if (modelProbablyCloze && !templateDocument.containsCloze && replacement.type === AstItemType.replacement)
                        allDiagnostics.push(createDiagnostic(document, replacement.start + 2,
                            replacement.filterSegments.find(filterSegment => filterSegment.filter)?.start ?? replacement.fieldSegment.field?.start ?? (replacement.end - 2),
                            "The template of a cloze note type must contain at least one replacement with a cloze filter.", DiagnosticCode.missingClozeFilter));
                    
                    // Check field
                    if (field) {
                        const invalidStartSpaceMatch = replacement.fieldSegment.content.match(/^\s+/);
                        if (invalidStartSpaceMatch && replacement.filterSegments.length > 0)
                            allDiagnostics.push(matchToDiagnostic(document, invalidStartSpaceMatch, replacement.fieldSegment.start,
                                "A field name can't be preceded by a space when the replacement contains one or more ':' characters.",
                                DiagnosticCode.invalidSpace));
                        
                        if (field.content === "FrontSide" && replacement.filterSegments.length > 0 && validFields.has("FrontSide"))
                            // Provide warning diagnostic when FrontSide field is preceded by a filter
                            allDiagnostics.push(createDiagnostic(document, replacement.start + 2, field.start,
                                "Filters have no effect on the special 'FrontSide' field.",
                                DiagnosticCode.invalidFilter,
                                vscode.DiagnosticSeverity.Warning
                            ));
                    }

                    // Get a set of field names that are unavailable in this replacement
                    // because they were used in conditional parent replacements.
                    const unavailableFieldNames = getUnavailableFieldNames(replacement);

                    // Provide warning diagnostics for unavailable fields
                    if (field && unavailableFieldNames.has(field.content))
                        allDiagnostics.push(createDiagnostic(document, field.start, field.end,
                            `The field '${field.content}' has been checked to be empty in a conditonal ^ parent tag.\n` +
                            "As a result, the field will not display any content when used here.",
                            DiagnosticCode.invalidField,
                            vscode.DiagnosticSeverity.Warning));

                    if (field && containsTtsVoicesFilter)
                        // Provide warning for ineffective field in this replacement
                        allDiagnostics.push(createDiagnostic(document, field.start, field.end,
                            "This field will not be visible because a 'tts-voices' filter is used in this replacement.",
                            undefined,
                            vscode.DiagnosticSeverity.Hint,
                            vscode.DiagnosticTag.Unnecessary));
                    
                    for (const [i, filterSegment] of replacement.filterSegments.entries()) {

                        const { filter } = filterSegment;
                        const builtInFilter = filter ? validFiltersMap.get(filter.content) : undefined;

                        if (filter && containsTtsVoicesFilter && i !== ttsVoicesFilterSegmentIndex) {
                            // Provide warning when the tts-voices filter is present in this replacement
                            allDiagnostics.push(createDiagnostic(document, filter.start, filter.arguments[filter.arguments.length - 1]?.end ?? filter.end,
                                `This filter will have no effect because ${
                                    filter.content === "tts-voices" ? "another" : "a"
                                } 'tts-voices' filter is used in this replacement.`,
                                undefined,
                                vscode.DiagnosticSeverity.Hint,
                                vscode.DiagnosticTag.Unnecessary));
                            continue;
                        }
                        // Check if filter name exists
                        else if (config.get("invalidFilterDiagnostics") && filter && !validFilterNames.includes(filter.content))
                            allDiagnostics.push(createDiagnostic(document, filter.start, filter.end,
                                `'${filter.content}' is not a built-in filter.`,
                                DiagnosticCode.invalidFilterName));
                        // Check if filter is missing a required preceding filter
                        else if (config.get("invalidFilterDiagnostics") && filter && builtInFilter
                            && missingRequiredPrecedingFilter(builtInFilter, replacement.filterSegments.slice(0, i)))
                            allDiagnostics.push(createDiagnostic(document, filter.start, filter.end,
                                `'${filter.content}' can only be used directly after the '${builtInFilter.requiredPrecedingFilter}' filter.`,
                                DiagnosticCode.missingPrecedingFilter));
                        // Check for cloze filter used on non-cloze template
                        else if (modelAvailable && !modelProbablyCloze && (filter?.content === "cloze" || filter?.content === "cloze-only"))
                            allDiagnostics.push(createDiagnostic(document, filter.start, filter.end,
                                `The '${filter.content}' filter may only be used on the cloze note type and on note types created by cloning the cloze note type.`));

                        // Check for invalid spacing at the start of filter segment
                        const startSpaceMatch = filterSegment.content.match(/^\s+/);
                        if (i > 0 && startSpaceMatch) {
                            if (filterSegment.filter)
                                allDiagnostics.push(matchToDiagnostic(document, startSpaceMatch, filterSegment.start,
                                    "Consecutive filters can't start with a space.",
                                    DiagnosticCode.invalidSpace));
                            // Check for empty filter segments preceded by non-empty filter segments
                            else if (!containsTtsVoicesFilter && replacement.filterSegments.slice(0, i).some(({ filter }) => filter !== undefined))
                                allDiagnostics.push(matchToDiagnostic(document, startSpaceMatch, filterSegment.start,
                                    "Empty filter segments are not allowed when preceded by other filters.",
                                    DiagnosticCode.invalidSpace));
                        }

                        // Check for invalid spacing at the end of filter segment
                        const endSpaceMatch = filterSegment.content.match(/\s+$/g)
                        if (endSpaceMatch && filterSegment.filter && filterSegment.filter?.content !== "tts")
                            allDiagnostics.push(matchToDiagnostic(document, endSpaceMatch, filterSegment.end - endSpaceMatch[0].length,
                                "Filters can't end with a space, tab or new line character.",
                                DiagnosticCode.invalidSpace));
                                
                        // Diagnostics for tts filter
                        if (filter?.content === "tts") {
                            const languageArg = filter.arguments[0];

                            // Check if the required language argument is set for the tts filter
                            if (!languageArg)
                                allDiagnostics.push(createDiagnostic(document, filter.start, filterSegment.end,
                                    "The tts filter name must be followed by a language code.\nFor example: en_US",
                                    DiagnosticCode.missingTtsLanguageArg
                                ));
                            // Check if the first argument of the tts filter is the language argument
                            else if (languageArg.type === AstItemType.filterArgumentKeyValue) {
                                allDiagnostics.push(createDiagnostic(document, filter.end + 1, languageArg.end,
                                    "The tts filter name must be followed by a language code.\nFor example: en_US\n" + 
                                    "Key value arguments can only be used after the language code argument.",
                                    DiagnosticCode.invalidTtsLanguageArg
                                ));
                            }
                            
                            // Check if there is more than one space between the tts filter name and the language argument
                            if (languageArg?.type === AstItemType.filterArgument) {
                                const separatingSpaces = filterSegment.content.substring(filter.end - filterSegment.start, languageArg.start - filterSegment.start);
                                    
                                if (separatingSpaces !== " ") {
                                    const incorrectSpace = separatingSpaces.length === 1;
                                    allDiagnostics.push(createDiagnostic(document, filter.end + (incorrectSpace ? 0 : 1), languageArg.start,
                                        "The tts filter name and language argument must be separated by exactly one space.",
                                        incorrectSpace ? DiagnosticCode.incorrectSpace : DiagnosticCode.invalidSpace
                                    ));
                                }
                            }

                            if (filter.arguments.length > 1) {
                                // Check any argument after the language argument
                                for (const arg of filter.arguments.slice(1)) {
                                    if (arg.type === AstItemType.filterArgument)
                                        allDiagnostics.push(createDiagnostic(document, arg.start, arg.end,
                                            "Invalid argument for tts filter.\n" +
                                            "Arguments following the first argument must be key value options.\n" +
                                            "For example: 'speed=1.5'."
                                        ));
                                    else if (arg.type === AstItemType.filterArgumentKeyValue) {
                                        const ttsOption = ttsOptions.get(arg.key.content);
                                        // Check if argument key is a vlaid option for tts filter
                                        if (!ttsOption) {
                                            allDiagnostics.push(createDiagnostic(document, arg.key.start, arg.key.end,
                                                `'${arg.key.content}' is not a valid option for the tts filter.\n Valid options are: ${
                                                    ttsOptionsList.map(arg => `${arg.name}`).join(", ")
                                                }`,
                                                DiagnosticCode.invalidTtsOption
                                            ));
                                            continue;
                                        }
                                        
                                        // Check if the divider character between the key and value is exactly one '='
                                        if (arg.divider.content.length > 1) {
                                            allDiagnostics.push(createDiagnostic(document, arg.divider.start + 1, arg.divider.end,
                                                "The character between key and value must be exactly one '=' character.",
                                                DiagnosticCode.invalidCharacter
                                            ));
                                        }

                                        // Check if option is allowed to contain multiple comma separated values
                                        if (!ttsOption.multiple && (arg.values.length > 1 || arg.content.endsWith(",")))
                                            allDiagnostics.push(createDiagnostic(document, arg.values[0].end, arg.end,
                                                `Only one value must be given for option '${ttsOption.name}'.`,
                                                DiagnosticCode.invalidTtsOptionValue
                                            ));
                                        // Check if key value argument contains at least one value
                                        else if (arg.values.length === 0)
                                            allDiagnostics.push(createDiagnostic(document, arg.divider.end, arg.divider.end,
                                                `No value given for option '${arg.key.content}'.`,
                                                undefined,
                                                vscode.DiagnosticSeverity.Warning
                                            ));
                                        
                                        // Check formatting of values for this option
                                        for (const value of arg.values.slice(0, ttsOption.multiple ? arg.values.length : 1)) {
                                            const validMatch = value.content.match(ttsOption.validMatch);
                                            if (validMatch)
                                                continue;
                                            
                                            allDiagnostics.push(createDiagnostic(document, value.start, value.end,
                                                ttsOption.invalidMessage
                                            ));
                                        }
                                    }
                                }
                            }
                        }
                        // Check if arguments were provided for a built-in filter other than the tts filter
                        else if (config.get("invalidFilterDiagnostics") && filter && filter.arguments.length > 0 && builtinFiltersNames.includes(filter.content)) {
                            allDiagnostics.push(createDiagnostic(document, filter.end, filter.arguments[filter.arguments.length-1].end,
                                `'${filter.content}' filter does not take any arguments.`,
                                DiagnosticCode.invalidFilterArgument));
                        }
                    }
                }
                else if (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) {                    
                    // Provide diagnostic when the special field 'FrontSide' is used in a conditional tag
                    if (field?.content === "FrontSide") {
                        allDiagnostics.push(createDiagnostic(document, field.start, field.end,
                            "The special field 'FrontSide' can't be used in a conditional opening or closing tag.",
                            DiagnosticCode.invalidField));
                    }

                    // Provide diagnostics for conditional start tags without closing tags
                    if (replacement.type === AstItemType.conditionalStart && !replacement.linkedTag) {
                        allDiagnostics.push(createDiagnostic(document, replacement.start, replacement.end,
                            "Conditional opening tag does not have a matching closing tag.",
                            DiagnosticCode.missingClosingTag));
                    }
                    // Provide diagnostics for conditional end tags without opening tags
                    else if (replacement.type === AstItemType.conditionalEnd && !replacement.linkedTag) {
                        allDiagnostics.push(createDiagnostic(document, replacement.start, replacement.end,
                            "Conditional closing tag does not have a matching opening tag.",
                            DiagnosticCode.missingOpeningTag));
                    }

                    // Provide warning diagnostics for conditional start tag nested inside another
                    // conditional start tag with the same field name.
                    if (replacement.type === AstItemType.conditionalStart && field && replacement.parentConditional) {
                        const parentConditionals = getParentConditionals(replacement.parentConditional).reverse();
                        
                        const sameFieldParent = parentConditionals.find(conditional => conditional.fieldSegment.field?.content === field.content);
                        if (sameFieldParent) {
                            const replacementConditionalChar = conditionalStartChar(replacement.conditionalType);
                            const parentConditionalChar = conditionalStartChar(sameFieldParent.conditionalType);
                            allDiagnostics.push(createDiagnostic(document, replacement.start, replacement.end,
                                `This conditional ${replacementConditionalChar} tag is nested inside a conditional ${parentConditionalChar} tag with the same field name.\nAs a result, ` +
                                (replacement.conditionalType === sameFieldParent.conditionalType
                                    ? "this conditional block has no effect."
                                    : "content inside this conditional block will never be visible."),
                                undefined,
                                vscode.DiagnosticSeverity.Warning));
                            
                            if (replacementConditionalChar !== parentConditionalChar && replacement.linkedTag)
                                // Mark content of conditional block as dead code using a diagnostic with tag Unnecessary.
                                allDiagnostics.push(createDiagnostic(document, replacement.end, replacement.linkedTag.start,
                                    `This content will never be visible because it's inside a conditional ${replacementConditionalChar} block nested inside a conditional ${parentConditionalChar} ` +
                                    "block with the same name.",
                                    undefined,
                                    vscode.DiagnosticSeverity.Hint,
                                    vscode.DiagnosticTag.Unnecessary));
                        }
                    }

                    // Provide error diagnostic for filter syntax in a conditional replacement
                    const invalidFilterMatch = replacement.fieldSegment.content.match(/.*:/);
                    if (invalidFilterMatch)
                        allDiagnostics.push(matchToDiagnostic(document, invalidFilterMatch, replacement.fieldSegment.start,
                            "Filters are not allowed in conditional opening or closing tags.",
                            DiagnosticCode.invalidFilter));
                }
                
            }
            
        }
        else {
            // Show error if there's no replacements in the template
            allDiagnostics.push(createDiagnostic(document, 0, 0,
                "No replacement found. A card template must contain at least one replacement."));
        }

        const cssEmbeddedDocument = this.getEmbeddedByLanguage(document, "css");
        if (cssEmbeddedDocument) {
            // css    
            const cssDocument = CssTextDocument.create(cssEmbeddedDocument.virtualUri.toString(),
                cssEmbeddedDocument.languageId, document.version, cssEmbeddedDocument.content);
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
            
            const jsSourceFile = this.tsProject.createSourceFile(
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

            this.tsProject.removeSourceFile(jsSourceFile);
            
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

const matchToDiagnostic = (
    document: vscode.TextDocument, 
    match: RegExpMatchArray, 
    offset: number, 
    message: string, 
    code?: DiagnosticCode,
    severity?: vscode.DiagnosticSeverity): vscode.Diagnostic =>
    createDiagnostic(document, offset + (match.index ?? 0), offset + (match.index ?? 0) + match[0].length, message, code, severity);

const createDiagnostic = (
    document: vscode.TextDocument,
    start: number,
    end: number,
    message: string,
    code?: DiagnosticCode,
    severity?: vscode.DiagnosticSeverity,
    tag?: vscode.DiagnosticTag): vscode.Diagnostic => {
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(document.positionAt(start), document.positionAt(end)),
            message,
            severity
        );
        diagnostic.code = code;
        diagnostic.tags = tag ? [tag] : undefined;
        return diagnostic;
    }
    