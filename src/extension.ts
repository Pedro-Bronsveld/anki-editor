// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AnkiEditorFs } from './anki-editor-filesystem';
import { ANKI_EDITOR_SCHEME } from './constants';
import { runHoverProviderDummy } from './language-service/hover-provider-dummy';
import TemplateCompletionItemProvider from './language-service/template-completion-item-provider';
import TemplateDefinitionProvider from './language-service/template-definition-provider';
import TemplateDiagnosticsProvider from './language-service/template-diagnostics-collection';
import TemplateHighlightsProvider from './language-service/template-highlights-provider';
import TemplateHoverProvider from './language-service/template-hover-provider';
import TemplateDocumentChangeProvider from './language-service/template-document-change-provider';
import TemplateRenameProvider from './language-service/template-rename-provider';
import TemplateSemanticTokenProvider, { tsTokenLegend } from './language-service/template-semantic-token-provider';
import TemplateSignatureHelpProvider from './language-service/template-signature-help-provider';
import TemplateSymbolProvider from './language-service/template-symbol-provider';
import VirtualDocumentProvider from './language-service/virtual-documents-provider';
import { NoteTypesTreeProvider } from './note-types-tree-provider';
import TemplateTypeHierarchyProvider from './language-service/template-type-hierarchy-provider';
import TemplateReferenceProvider from './language-service/template-reference-provider';
import TemplateCodeActionProvider from './language-service/template-code-action-provider';
import TemplateDocumentColorProvider from './language-service/template-document-color-provider';
import TemplateDocumentFormattingEditProvider from './language-service/template-document-formatting-edit-provider';
import TemplateDocumentRangeFormattingEditProvider from './language-service/template-document-range-formatting-edit-provider';
import TemplateFoldingRangeProvider from './language-service/template-folding-range-provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "anki-editor" is now active!');

	// Create Anki Eidtor Filesystem
	const ankiCardFs = new AnkiEditorFs();
	context.subscriptions.push(
			vscode.workspace.registerFileSystemProvider('anki-editor', ankiCardFs, { isCaseSensitive: true })
		);

	// Add command to add anki editor root folder to workspace
	context.subscriptions.push(vscode.commands.registerCommand('anki-editor.openAsFolder', _ => {
			// vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('anki-editor:'), name: "Anki Editor" });
			vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(`${ANKI_EDITOR_SCHEME}`));
		}));

	// Register note type tree
	const noteTypesProvider = new NoteTypesTreeProvider();
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

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('anki-editor.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from anki-editor!');
	});

	context.subscriptions.push(disposable);

	// Language service features
	const virtualDocumentProvider = new VirtualDocumentProvider();
	const diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('anki');
	
	const templateSemanticTokenProvider = new TemplateSemanticTokenProvider(virtualDocumentProvider);
	const templateHoverProvider = new TemplateHoverProvider(virtualDocumentProvider);
	const templateCompletionItemProvider = new TemplateCompletionItemProvider(virtualDocumentProvider);
	const templateSignatureHelpProvider = new TemplateSignatureHelpProvider(virtualDocumentProvider);
	const templateRenameProvider = new TemplateRenameProvider(virtualDocumentProvider);
	const templateDiagnosticsProvider = new TemplateDiagnosticsProvider(virtualDocumentProvider);
	const templateDefinitionProvider = new TemplateDefinitionProvider(virtualDocumentProvider);
	const templateHighlightsProvider = new TemplateHighlightsProvider(virtualDocumentProvider);
	const templateSymbolProvider = new TemplateSymbolProvider(virtualDocumentProvider);
	const templateDocumentChangeProvider = new TemplateDocumentChangeProvider(virtualDocumentProvider);
	const templateTypeHierarchyProvider = new TemplateTypeHierarchyProvider(virtualDocumentProvider);
	const templateReferenceProvider = new TemplateReferenceProvider(virtualDocumentProvider);
	const templateCodeActionProvider = new TemplateCodeActionProvider(virtualDocumentProvider);
	const templateDocumentColorProvider = new TemplateDocumentColorProvider(virtualDocumentProvider);
	const templateDocumentFormattingEditProvider = new TemplateDocumentFormattingEditProvider(virtualDocumentProvider);
	const templateDocumentRangeFormattingEditProvider = new TemplateDocumentRangeFormattingEditProvider(virtualDocumentProvider);
	const templateFoldingRangeProvider = new TemplateFoldingRangeProvider(virtualDocumentProvider);

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider('anki-editor-embedded', virtualDocumentProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSemanticTokensProvider({ language: "anki" }, templateSemanticTokenProvider, tsTokenLegend)
	);

	context.subscriptions.push(
		vscode.languages.registerHoverProvider({ language: "anki" }, templateHoverProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider({ language: "anki" }, templateCompletionItemProvider, ".")
	);

	context.subscriptions.push(
		vscode.languages.registerSignatureHelpProvider({ language: "anki" }, templateSignatureHelpProvider, "(")
	);

	context.subscriptions.push(
		vscode.languages.registerRenameProvider({ language: "anki" }, templateRenameProvider)
	);
	
	if (vscode.window.activeTextEditor) {
		templateDiagnosticsProvider.updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
		// running this twice because sometimes diagnostics aren't loaded if the file was already opened in the editor
		templateDiagnosticsProvider.updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
	}
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			templateDiagnosticsProvider.updateDiagnostics(editor.document, diagnosticCollection);
		}
	}));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
			templateDiagnosticsProvider.updateDiagnostics(event.document, diagnosticCollection);
	}));

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider({ language: "anki" }, templateDefinitionProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentHighlightProvider({ language: "anki" }, templateHighlightsProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider({ language: "anki" }, templateSymbolProvider)
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => templateDocumentChangeProvider.onDocumentChange(event))
	);
	
	context.subscriptions.push(
		vscode.languages.registerTypeHierarchyProvider({ language: "anki" }, templateTypeHierarchyProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerReferenceProvider({ language: "anki" }, templateReferenceProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider({ language: "anki" }, templateCodeActionProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerColorProvider({ language: "anki" }, templateDocumentColorProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider({ language: "anki" }, templateDocumentFormattingEditProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentRangeFormattingEditProvider({ language: "anki" }, templateDocumentRangeFormattingEditProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerFoldingRangeProvider({ language: "anki" }, templateFoldingRangeProvider)
	);

	// Hack to work around vscode only providing hover information after the first 2 hovers
	// for embedded javascript. Simply performs two dummy hovers when the extension activates.
	runHoverProviderDummy(virtualDocumentProvider);
	
}

// This method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
	context.subscriptions.forEach(subscription => subscription.dispose());
}
