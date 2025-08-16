import * as vscode from 'vscode';
import VirtualQuickDiffProvider from './virtual-quick-diff-provider';
import { toAnkiEditorUri, toInitialUri } from '../virtual-uris';
import VirtualDocumentProvider from '../../virtual-documents-provider';
import { LineChange } from '../../../models/vscode/scm/line-change';
import { ANKI_EDITOR_SCHEME, ANKI_EDITOR_SCHEME_BASE } from '../../../constants';

export default class VirtualSourceControl implements vscode.Disposable {
    readonly sourceControl: vscode.SourceControl;
    private resourceGroup: vscode.SourceControlResourceGroup;
    readonly quickDiffProvider: VirtualQuickDiffProvider;

    constructor(private initialDocumentProvider: VirtualDocumentProvider) {
        this.sourceControl = vscode.scm.createSourceControl("anki-editor-scm", "Anki Editor Changes", vscode.Uri.parse(ANKI_EDITOR_SCHEME));
        this.resourceGroup = this.sourceControl.createResourceGroup("workingTree", "Changes since opened");
        this.quickDiffProvider = new VirtualQuickDiffProvider();
        this.sourceControl.quickDiffProvider = this.quickDiffProvider;
        this.sourceControl.inputBox.placeholder = "Message not used by Anki Editor.";
    }

    async updateResourceGroupResources(): Promise<void> {

        const allUris = this.initialDocumentProvider.uriEntries
            .map(([initialUri]) => ({
                docUri: toAnkiEditorUri(initialUri),
                initialUri
            }));
        
        const changedUris = (await Promise.all(allUris.map(async input => ({
            ...input,
            hasChanges: await this.hasChanges(input.docUri, input.initialUri)
        })))).filter(({ hasChanges }) => hasChanges);

        const sourceControlResourceStates = changedUris.map(({ docUri, initialUri }) => this.toSourceControlResourceState(docUri, initialUri, false));
        
        this.resourceGroup.resourceStates = sourceControlResourceStates;
        this.sourceControl.count = sourceControlResourceStates.length;
    }

    toSourceControlResourceState(docUri: vscode.Uri, initialUri: vscode.Uri, deleted: boolean): vscode.SourceControlResourceState {

		// const initialUri = toInitialUri(docUri);

		const command: vscode.Command | null = !deleted
			? {
				title: "Show changes",
				command: "vscode.diff",
				arguments: [initialUri, docUri, `Initial Temlate ↔ Current Template`],
				tooltip: "Diff your changes"
			}
			: null;

		const resourceState: vscode.SourceControlResourceState = {
			resourceUri: docUri,
			command: command ?? undefined,
			decorations: {
				strikeThrough: deleted,
				tooltip: 'Template was deleted or renamed.'
			}
		};

		return resourceState;
	}

    async hasChanges(docUri: vscode.Uri, initialUri: vscode.Uri): Promise<boolean> {
        const initialDocumentText = this.initialDocumentProvider.get(initialUri);

        if (initialDocumentText === undefined)
            return false;
        
        const document = await vscode.workspace.openTextDocument(docUri);
        const documentText = document.getText();

        return initialDocumentText !== documentText;
    }

    async discardAllChanges() {
        await this.discardResourceStates(this.resourceGroup.resourceStates);
    }

    async discardResourceStates(resourceStates: vscode.SourceControlResourceState[]) {
        for (const resourceState of resourceStates) {
            await this.discardResource(resourceState.resourceUri);
        }
    }

    async discardActiveEditor() {
        if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri.scheme === ANKI_EDITOR_SCHEME_BASE) {
            const activeUriString = vscode.window.activeTextEditor.document.uri.toString();
            const activeResourceState = this.resourceGroup.resourceStates.find(resourceState => resourceState.resourceUri.toString() === activeUriString);
            if (activeResourceState)
                this.discardResource(activeResourceState.resourceUri);
        }
    }

    async discardResource(uri: vscode.Uri) {
        const document = await vscode.workspace.openTextDocument(uri);
        
        const initialUri = toInitialUri(uri);
        const initialDocument = await vscode.workspace.openTextDocument(initialUri);
        const initialDocumentText = initialDocument.getText();

        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri,
            new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount-1).range.end),
            initialDocumentText
        );

        await vscode.workspace.applyEdit(edit);
        await document.save();
    }

    async discardLineChanges(uri: vscode.Uri, changes: LineChange[], index: number) {
        if (!uri || index < 0 || index >= changes.length)
            return;

		const textEditor = vscode.window.visibleTextEditors.filter(e => e.document.uri.toString() === uri.toString())[0];

        const initialUri = toInitialUri(uri);
        const initialDocument = await vscode.workspace.openTextDocument(initialUri);

        if (!textEditor)
            return;

        const revertChange = changes[index];

        const isInsertion = revertChange.originalEndLineNumber === 0;
        const isDeletion = revertChange.modifiedEndLineNumber === 0;

        // Determine zero-based start and end line indexes
        const modifiedStartLineIndex = revertChange.modifiedStartLineNumber - (isDeletion ? 0 : 1);
        const modifiedEndLineIndex = isDeletion
            ? modifiedStartLineIndex
            : revertChange.modifiedEndLineNumber;
        
        const originalStartLineIndex = revertChange.originalStartLineNumber - (isInsertion ? 0 : 1);
        const originalEndLineIndex = isInsertion
            ? originalStartLineIndex
            : revertChange.originalEndLineNumber;
            
        // Setup document ranges and replacements text
        const isAtEndOfDocument = originalEndLineIndex === initialDocument.lineCount;
        
        const modifiedRange = new vscode.Range(
            isInsertion && isAtEndOfDocument
                ? textEditor.document.lineAt(modifiedStartLineIndex-1).range.end
                : new vscode.Position(modifiedStartLineIndex, 0),
            new vscode.Position(modifiedEndLineIndex, 0)
        );
        const modifiedText = textEditor.document.getText(modifiedRange);
        
        const originalRange = new vscode.Range(
            isDeletion && isAtEndOfDocument
                ? initialDocument.lineAt(originalStartLineIndex-1).range.end
                : new vscode.Position(originalStartLineIndex, 0),
            new vscode.Position(originalEndLineIndex, 0)
        );
        const originalText = initialDocument.getText(originalRange);
        
        // Create and apply edit
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, modifiedRange, originalText);
        vscode.workspace.applyEdit(edit);
    }
    
    dispose() {
        this.initialDocumentProvider.clear();
        this.sourceControl.dispose();
    }

}
