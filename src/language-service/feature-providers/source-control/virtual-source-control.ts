import * as vscode from 'vscode';
import VirtualQuickDiffProvider from './virtual-quick-diff-provider';
import { toAnkiEditorUri, toInitialUri } from '../virtual-uris';
import VirtualDocumentProvider from '../../virtual-documents-provider';
import { LineChange } from '../../../models/vscode/scm/line-change';
import { ANKI_EDITOR_SCHEME, ANKI_EDITOR_SCHEME_BASE, ANKI_EDITOR_SCM_ID } from '../../../constants';
import { UriPair, ChangedUriPair } from '../../../models/vscode/scm/uri-pair';
import { resolveDocumentLineChange } from '../../../source-control/resolve-document-line-change';

export default class VirtualSourceControl implements vscode.Disposable {
    readonly sourceControl: vscode.SourceControl;
    private resourceGroup: vscode.SourceControlResourceGroup;
    readonly quickDiffProvider: VirtualQuickDiffProvider;

    constructor(private initialDocumentProvider: VirtualDocumentProvider) {
        this.sourceControl = vscode.scm.createSourceControl(ANKI_EDITOR_SCM_ID, "Anki Editor Changes", vscode.Uri.parse(ANKI_EDITOR_SCHEME));
        this.resourceGroup = this.sourceControl.createResourceGroup("workingTree", "Changes since opened");
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
        const initialDocument = await vscode.workspace.openTextDocument(initialUri)
        const initialDocumentText = initialDocument.getText();

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

    // Discarding Changes

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
                await this.discardResource(activeResourceState.resourceUri);
        }
    }

    private async discardResource(uri: vscode.Uri) {
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

        const {
            modifiedRange,
            originalText
        } = resolveDocumentLineChange(textEditor.document, initialDocument, revertChange);
        
        // Create and apply edit
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, modifiedRange, originalText);
        await vscode.workspace.applyEdit(edit);
        await textEditor.document.save();
    }

    // Committing Changes

    async commitAllChanges() {
        await this.commitResourceStates(this.resourceGroup.resourceStates);
    }

    async commitResourceStates(resourceStates: vscode.SourceControlResourceState[]) {
        const uris = resourceStates.map(({ resourceUri }) => resourceUri);
        for (const uri of uris) {
            await this.commitResource(uri);
        }
        await this.updateResourceGroupResources(uris);
    }

    async commitActiveEditor() {
        if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri.scheme === ANKI_EDITOR_SCHEME_BASE) {
            const activeUriString = vscode.window.activeTextEditor.document.uri.toString();
            const activeResourceState = this.resourceGroup.resourceStates.find(resourceState => resourceState.resourceUri.toString() === activeUriString);
            if (activeResourceState) {
                await this.commitResource(activeResourceState.resourceUri);
                await this.updateResourceGroupResources(activeResourceState.resourceUri);
            }
        }
    }

    private async commitResource(uri: vscode.Uri) {
        const document = await vscode.workspace.openTextDocument(uri);
        const initialUri = toInitialUri(uri);
        const initialDocument = await vscode.workspace.openTextDocument(initialUri);

        const documentText = document.getText();
        const edit = new vscode.WorkspaceEdit();
        const initialDocumentLastLine = initialDocument.lineAt(initialDocument.lineCount-1);
        edit.replace(initialUri,
            new vscode.Range(
                new vscode.Position(0, 0),
                initialDocumentLastLine.range.end
            ), documentText);
        await vscode.workspace.applyEdit(edit);
    }

    async commitLineChanges(uri: vscode.Uri, changes: LineChange[], index: number) {
        if (!uri || index < 0 || index >= changes.length)
            return;
        
        const document = await vscode.workspace.openTextDocument(uri);
        const initialUri = toInitialUri(uri);
        const initialDocument = await vscode.workspace.openTextDocument(initialUri);

        const commitChange = changes[index];
        
        const {
            modifiedText,
            originalRange
        } = resolveDocumentLineChange(document, initialDocument, commitChange);

        const edit = new vscode.WorkspaceEdit();
        edit.replace(initialUri, originalRange, modifiedText);
        await vscode.workspace.applyEdit(edit);
        await document.save();
        await this.updateResourceGroupResources(uri);
    }
    
    dispose() {
        this.initialDocumentProvider.clear();
        this.sourceControl.dispose();
    }

}
