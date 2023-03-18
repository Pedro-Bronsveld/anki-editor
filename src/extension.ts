// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AnkiEditorFs } from './anki-editor-filesystem';
import { ANKI_EDITOR_EMBEDDED_SCHEME_BASE, ANKI_EDITOR_SCHEME, ANKI_EDITOR_SCHEME_BASE, TEMPLATE_SELECTOR } from './constants';
import TemplateCompletionItemProvider from './language-service/feature-providers/template-completion-item-provider';
import TemplateDefinitionProvider from './language-service/feature-providers/template-definition-provider';
import TemplateDiagnosticsProvider from './language-service/feature-providers/template-diagnostics-collection';
import TemplateHighlightsProvider from './language-service/feature-providers/template-highlights-provider';
import TemplateHoverProvider from './language-service/feature-providers/template-hover-provider';
import TemplateDocumentChangeProvider from './language-service/feature-providers/template-document-change-provider';
import TemplateRenameProvider from './language-service/feature-providers/template-rename-provider';
import TemplateSemanticTokenProvider, { tsTokenLegend } from './language-service/feature-providers/template-semantic-token-provider';
import TemplateSignatureHelpProvider from './language-service/feature-providers/template-signature-help-provider';
import TemplateSymbolProvider from './language-service/feature-providers/template-symbol-provider';
import VirtualDocumentProvider from './language-service/virtual-documents-provider';
import { NoteTypesTreeProvider } from './note-types-tree-provider';
import TemplateTypeHierarchyProvider from './language-service/feature-providers/template-type-hierarchy-provider';
import TemplateReferenceProvider from './language-service/feature-providers/template-reference-provider';
import TemplateCodeActionProvider from './language-service/feature-providers/template-code-action-provider';
import TemplateDocumentColorProvider from './language-service/feature-providers/template-document-color-provider';
import TemplateDocumentFormattingEditProvider from './language-service/feature-providers/template-document-formatting-edit-provider';
import TemplateDocumentRangeFormattingEditProvider from './language-service/feature-providers/template-document-range-formatting-edit-provider';
import TemplateFoldingRangeProvider from './language-service/feature-providers/template-folding-range-provider';
import AnkiModelDataProvider from './language-service/anki-model-data-provider';
import AnkiConnect from './anki-connect/anki-connect';
import EmbeddedHandler from './language-service/embedded-handler';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "anki-editor" is now active!');

	// Setup Anki-Connect class and cache handling
	const ankiConnect = new AnkiConnect();
	context.subscriptions.push(
		vscode.window.onDidChangeWindowState(state => {
			if (!state.focused) {
				ankiConnect.clearCache();
			}
		})
	);

	// Create Anki Eidtor Filesystem
	const ankiCardFs = new AnkiEditorFs(ankiConnect);
	context.subscriptions.push(
			vscode.workspace.registerFileSystemProvider(ANKI_EDITOR_SCHEME_BASE, ankiCardFs, { isCaseSensitive: true })
		);

	// Add command to add anki editor root folder to workspace
	context.subscriptions.push(vscode.commands.registerCommand('anki-editor.openAsFolder', _ => {
			// vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('anki-editor:'), name: "Anki Editor" });
			vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(`${ANKI_EDITOR_SCHEME}`));
		}));

	// Register note type tree
	const noteTypesProvider = new NoteTypesTreeProvider(ankiConnect);
	context.subscriptions.push(
			vscode.window.registerTreeDataProvider("note-types-tree", noteTypesProvider)
		);

	// Refresh node type tree list in tree command
	context.subscriptions.push(
		vscode.commands.registerCommand('anki-editor.refreshNoteTypesTree', () => {
			noteTypesProvider.refresh();
		}));

	// Refresh node type tree on window focus
	context.subscriptions.push(vscode.window.onDidChangeWindowState((e) => {
			if (e.focused)
				vscode.commands.executeCommand("anki-editor.refreshNoteTypesTree");
		}));

	// Language service features
	const virtualDocumentProvider = new VirtualDocumentProvider();
	const embeddedHandler = new EmbeddedHandler(virtualDocumentProvider);
	const ankiModelDataProvider: AnkiModelDataProvider = new AnkiModelDataProvider(ankiConnect);
	
	const templateSemanticTokenProvider = new TemplateSemanticTokenProvider(embeddedHandler);
	const templateHoverProvider = new TemplateHoverProvider(embeddedHandler);
	const templateCompletionItemProvider = new TemplateCompletionItemProvider(embeddedHandler, ankiModelDataProvider);
	const templateSignatureHelpProvider = new TemplateSignatureHelpProvider(embeddedHandler);
	const templateRenameProvider = new TemplateRenameProvider(embeddedHandler);
	const templateDiagnosticsProvider = new TemplateDiagnosticsProvider(embeddedHandler, ankiModelDataProvider);
	const templateDefinitionProvider = new TemplateDefinitionProvider(embeddedHandler);
	const templateHighlightsProvider = new TemplateHighlightsProvider(embeddedHandler);
	const templateSymbolProvider = new TemplateSymbolProvider(embeddedHandler);
	const templateDocumentChangeProvider = new TemplateDocumentChangeProvider(embeddedHandler);
	const templateTypeHierarchyProvider = new TemplateTypeHierarchyProvider(embeddedHandler);
	const templateReferenceProvider = new TemplateReferenceProvider(embeddedHandler);
	const templateCodeActionProvider = new TemplateCodeActionProvider(embeddedHandler, ankiModelDataProvider);
	const templateDocumentColorProvider = new TemplateDocumentColorProvider(embeddedHandler);
	const templateDocumentFormattingEditProvider = new TemplateDocumentFormattingEditProvider(embeddedHandler);
	const templateDocumentRangeFormattingEditProvider = new TemplateDocumentRangeFormattingEditProvider(embeddedHandler);
	const templateFoldingRangeProvider = new TemplateFoldingRangeProvider(embeddedHandler);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration("anki-editor")) {
				embeddedHandler.clearCache();
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(ANKI_EDITOR_EMBEDDED_SCHEME_BASE, virtualDocumentProvider)
	);

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument((document) => {
			if (document.uri.scheme === ANKI_EDITOR_EMBEDDED_SCHEME_BASE)
				embeddedHandler.clearCache(document);
		})
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSemanticTokensProvider(TEMPLATE_SELECTOR, templateSemanticTokenProvider, tsTokenLegend)
	);

	context.subscriptions.push(
		vscode.languages.registerHoverProvider(TEMPLATE_SELECTOR, templateHoverProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(TEMPLATE_SELECTOR, templateCompletionItemProvider, ".", "#", "^", "/")
	);

	context.subscriptions.push(
		vscode.languages.registerSignatureHelpProvider(TEMPLATE_SELECTOR, templateSignatureHelpProvider, "(")
	);

	context.subscriptions.push(
		vscode.languages.registerRenameProvider(TEMPLATE_SELECTOR, templateRenameProvider)
	);
	
	if (vscode.window.activeTextEditor) {
		templateDiagnosticsProvider.updateDiagnostics(vscode.window.activeTextEditor.document);
		// running this twice because sometimes diagnostics aren't loaded if the file was already opened in the editor
		templateDiagnosticsProvider.updateDiagnostics(vscode.window.activeTextEditor.document);
	}
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			templateDiagnosticsProvider.updateDiagnostics(editor.document);
		}
	}));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
			templateDiagnosticsProvider.updateDiagnostics(event.document);
	}));

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(TEMPLATE_SELECTOR, templateDefinitionProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentHighlightProvider(TEMPLATE_SELECTOR, templateHighlightsProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(TEMPLATE_SELECTOR, templateSymbolProvider)
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => templateDocumentChangeProvider.onDocumentChange(event))
	);
	
	context.subscriptions.push(
		vscode.languages.registerTypeHierarchyProvider(TEMPLATE_SELECTOR, templateTypeHierarchyProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerReferenceProvider(TEMPLATE_SELECTOR, templateReferenceProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(TEMPLATE_SELECTOR, templateCodeActionProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerColorProvider(TEMPLATE_SELECTOR, templateDocumentColorProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider(TEMPLATE_SELECTOR, templateDocumentFormattingEditProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentRangeFormattingEditProvider(TEMPLATE_SELECTOR, templateDocumentRangeFormattingEditProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerFoldingRangeProvider(TEMPLATE_SELECTOR, templateFoldingRangeProvider)
	);

	// Hack to work around vscode only providing hover information after the first 2 hovers
	// for embedded javascript. Simply performs two dummy hovers when the extension activates.
	// (commented out because a loader keeps spinning in the bottom left corner saying "activating js/ts server")
	// runHoverProviderDummy(virtualDocumentProvider);
	
}

// This method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
	context.subscriptions.forEach(subscription => subscription.dispose());
}
