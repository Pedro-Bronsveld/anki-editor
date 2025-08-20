import * as vscode from 'vscode';
import VirtualQuickDiffProvider from './virtual-quick-diff-provider';
import { toAnkiEditorUri, toInitialUri } from '../virtual-uris';
import VirtualDocumentProvider from '../../virtual-documents-provider';
import { LineChange } from '../../../models/vscode/scm/line-change';
import { ANKI_EDITOR_SCHEME, ANKI_EDITOR_SCHEME_BASE } from '../../../constants';
import { UriPair, ChangedUriPair } from '../../../models/vscode/scm/uri-pair';

export default class VirtualSourceControl implements vscode.Disposable {
    readonly sourceControl: vscode.SourceControl;
    private resourceGroup: vscode.SourceControlResourceGroup;
    readonly quickDiffProvider: VirtualQuickDiffProvider;

    constructor(private initialDocumentProvider: VirtualDocumentProvider) {
        this.sourceControl = vscode.scm.createSourceControl("anki-editor-scm", "Anki Editor Changes", vscode.Uri.parse(ANKI_EDITOR_SCHEME));
        this.resourceGroup = this.sourceControl.createResourceGroup("workingTree", "Saved changes since opened");
        this.quickDiffProvider = new VirtualQuickDiffProvider();
        this.sourceControl.quickDiffProvider = this.quickDiffProvider;
        this.sourceControl.inputBox.placeholder = "Message not used by Anki Editor.";
    }

    async updateResourceGroupResources(uris?: vscode.Uri | vscode.Uri[]): Promise<void> {

        const providedUris = uris ? (uris instanceof Array ? uris : [uris]) : undefined;
        
        const uriPairs: UriPair[] = providedUris
            // Check for changed only in provided uris
            ? providedUris.map<UriPair>(uri => ({
                    docUri: uri,
                    initialUri: toInitialUri(uri)
                }))
                .filter(({ initialUri }) => this.initialDocumentProvider.has(initialUri))
            // Check for changes in all resources saved in initial uris document provider
            : this.initialDocumentProvider.uriEntries
                .map<UriPair>(([initialUri]) => ({
                    docUri: toAnkiEditorUri(initialUri),
                    initialUri
                }));
        
        const checkedUriPairs = (await Promise.all(uriPairs.map<Promise<ChangedUriPair>>(async input => ({
            ...input,
            hasChanges: await this.hasChanges(input.docUri, input.initialUri)
        }))));
                
        const changedUriPairs = checkedUriPairs.filter(({ hasChanges }) => hasChanges);

        const sourceControlResourceStates = changedUriPairs.map(({ docUri, initialUri }) => this.toSourceControlResourceState(docUri, initialUri, false));
        
        if (providedUris) {
            // Update only resource states for provided uris, leave others unchanged
            const providedUrisSet = new Set(providedUris.map(uri => uri.toString()));
            this.resourceGroup.resourceStates = this.resourceGroup.resourceStates
                .filter(resourceState => !providedUrisSet.has( resourceState.resourceUri.toString() ))
                .concat(sourceControlResourceStates);
        }
        else {
            this.resourceGroup.resourceStates = sourceControlResourceStates;
        }

        this.sourceControl.count = this.resourceGroup.resourceStates.length;
    }

    toSourceControlResourceState(docUri: vscode.Uri, initialUri: vscode.Uri, deleted: boolean): vscode.SourceControlResourceState {

		const command: vscode.Command | null = !deleted
			? {
				title: "Show changes",
				command: "vscode.diff",
				arguments: [initialUri, docUri, `Initial ↔ Current`],
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
        
        // Get document as currently saved in Anki.
        const document = await vscode.workspace.openTextDocument(docUri.with({
            query: `t=${Date.now()}`
        }));
        const documentText = document.getText();

        const res = initialDocumentText !== documentText;
        return res;
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
