import { invoke } from '@autoanki/anki-connect';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AnkiCardFs } from './anki-card-filesystem';
import { CardTemplatesProvider } from './card-templates-tree';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "anki-template-editor" is now active!');

	const ankiCardFs = new AnkiCardFs();
	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('ankicardfs', ankiCardFs, { isCaseSensitive: true }));

	context.subscriptions.push(vscode.commands.registerCommand('anki-template-editor.workspaceInit', _ => {
		vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('ankicardfs:'), name: "Anki Test" });
	}));
	
	const noteTypesProvider = new CardTemplatesProvider();
	vscode.window.registerTreeDataProvider("card-templates", noteTypesProvider);

	vscode.commands.registerCommand('anki-template-editor.loadTemplate', (modelName: string, cardName: string, side: "Front" | "Back") => {
		
		invoke({
			action: "modelTemplates",
			version: 6,
			request: {
				modelName
			}
		}).then(modelTemplates => {
			const template = modelTemplates[cardName][side]
			console.log(`${side} Template:\n`, template);
		}).catch(err => {
			console.log(err);
		});
		
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('anki-template-editor.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from anki-template-editor!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
