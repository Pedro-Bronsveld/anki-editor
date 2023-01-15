// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AnkiEditorFs } from './anki-editor-filesystem';
import { NoteTypesTreeProvider } from './note-types-tree-provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "anki-template-editor" is now active!');

	// Create Anki Eidtor Filesystem
	const ankiCardFs = new AnkiEditorFs();
	context.subscriptions.push(
			vscode.workspace.registerFileSystemProvider('ankieditor', ankiCardFs, { isCaseSensitive: true })
		);

	// Add command to add anki editor root folder to workspace
	context.subscriptions.push(vscode.commands.registerCommand('anki-template-editor.workspaceInit', _ => {
			vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('ankieditor:/'), name: "Anki Editor" });
		}));

	// Register note type tree
	const noteTypesProvider = new NoteTypesTreeProvider();
	context.subscriptions.push(
			vscode.window.registerTreeDataProvider("note-types-tree", noteTypesProvider)
		);

	// Refresh node type tree list in tree command
	context.subscriptions.push(
		vscode.commands.registerCommand('anki-template-editor.refresNoteTypesTree', () => {
			noteTypesProvider.refresh();
		}));

	// Refresh node type tree on window focus
	context.subscriptions.push(vscode.window.onDidChangeWindowState((e) => {
			if (e.focused)
				vscode.commands.executeCommand("anki-template-editor.refresNoteTypesTree");
		}));

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('anki-template-editor.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from anki-template-editor!');
		// vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("ankieditor:/Note Types/Test Note Type/Card 3/Front.html"));
		vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse("ankieditor:/"));
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext) {
	context.subscriptions.forEach(subscription => subscription.dispose());
}
