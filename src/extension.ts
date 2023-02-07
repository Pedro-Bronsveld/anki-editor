// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AnkiEditorFs } from './anki-editor-filesystem';
import { ANKI_EDITOR_SCHEME } from './constants';
import { runHoverProviderDummy } from './language-service/hover-provider-dummy';
import TemplateCompletionItemProvider from './language-service/template-completion-item-provider';
import TemplateDefinitionProvider from './language-service/template-definition-provider';
import TemplateDiagnosticsProvider from './language-service/template-diagnostics-collection';
import TemplateHoverProvider from './language-service/template-hover-provider';
import TemplateRenameProvider from './language-service/template-rename-provider';
import TemplateSemanticTokenProvider from './language-service/template-semantic-token-provider';
import TemplateSignatureHelpProvider from './language-service/template-signature-help-provider';
import VirtualDocumentProvider from './language-service/virtual-documents-provider';
import { NoteTypesTreeProvider } from './note-types-tree-provider';

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
	const templateTokenLegend = new vscode.SemanticTokensLegend(['class', 'interface', 'enum', 'function', 'variable'], ['declaration', 'documentation', 'readonly']);
	
	const templateSemanticTokenProvider = new TemplateSemanticTokenProvider(virtualDocumentProvider, templateTokenLegend);
	const templateHoverProvider = new TemplateHoverProvider(virtualDocumentProvider);
	const templateCompletionItemProvider = new TemplateCompletionItemProvider(virtualDocumentProvider);
	const templateSignatureHelpProvider = new TemplateSignatureHelpProvider(virtualDocumentProvider);
	const templateRenameProvider = new TemplateRenameProvider(virtualDocumentProvider);
	const templateDiagnosticsProvider = new TemplateDiagnosticsProvider(virtualDocumentProvider);
	const templateDefinitionProvider = new TemplateDefinitionProvider(virtualDocumentProvider);

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider('anki-editor-embedded', virtualDocumentProvider)
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentSemanticTokensProvider({ language: "anki" }, templateSemanticTokenProvider, templateTokenLegend)
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

	// Hack to work around vscode only providing hover information after the first 2 hovers
	// for embedded javascript. Simply performs two dummy hovers when the extension activates.
	runHoverProviderDummy(virtualDocumentProvider);
	
}

// This method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
	context.subscriptions.forEach(subscription => subscription.dispose());
}
