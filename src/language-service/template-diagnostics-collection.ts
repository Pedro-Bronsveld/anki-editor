import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import { getCSSLanguageService, TextDocument as CssTextDocument } from 'vscode-css-languageservice';
import VirtualDocumentProvider from './virtual-documents-provider';
import { createProjectSync, Project, ts } from "@ts-morph/bootstrap";

export default class TemplateDiagnosticsProvider extends LanguageFeatureProviderBase {

    private cssLanguageService = getCSSLanguageService();
    private project: Project;
    private languageService: ts.LanguageService;

    private severityMap = {
        [ts.DiagnosticCategory.Warning]: vscode.DiagnosticSeverity.Warning,
        [ts.DiagnosticCategory.Error]: vscode.DiagnosticSeverity.Error,
        [ts.DiagnosticCategory.Suggestion]: vscode.DiagnosticSeverity.Hint,
        [ts.DiagnosticCategory.Message]: vscode.DiagnosticSeverity.Information
    } as const

    constructor(virtualDocumentProvider: VirtualDocumentProvider) {
        super(virtualDocumentProvider);

        this.project = createProjectSync({
            useInMemoryFileSystem: true,
            compilerOptions: {
                allowJs: true,
                checkJs: true
            }
        });

        this.languageService = this.project.getLanguageService();
    }
    
    async updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): Promise<void> {
        
        if (document.languageId !== "anki") {
            collection.clear();
            return;
        }

        const allDiagnostics: vscode.Diagnostic[] = [];

        const cssEmbeddedDocument = this.getEmbeddedByLanguage(document, "css");
        if (cssEmbeddedDocument){
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

            allDiagnostics.push(...allDiagnostics.concat(transformedDiagnostics));
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
    
            const diagnostics = this.languageService.getSemanticDiagnostics(fileName);
    
            const transformedDiagnostics: vscode.Diagnostic[] = diagnostics.map(dia => ({
                ...dia,
                range: new vscode.Range(document.positionAt(dia.start ?? 0), document.positionAt((dia.start ?? 0) + (dia.length ?? 0))),
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
                    message: typeof rel.messageText === "string" ? rel.messageText : this.flattenDiagnosticMessageChain(rel.messageText).join("\n"),
                }))
            }));
    
            allDiagnostics.push(...transformedDiagnostics);
        }

        collection.set(document.uri, allDiagnostics);
    }

    private flattenDiagnosticMessageChain(chain: ts.DiagnosticMessageChain): ts.DiagnosticMessageChain[] {
        return [chain].concat(chain.next ? chain.next.flatMap(this.flattenDiagnosticMessageChain) : []);
    }
    
}