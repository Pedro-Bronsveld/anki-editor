import * as vscode from 'vscode';
import AnkiConnect from './anki-connect/anki-connect';
import { NoteTypeTreeItem, CardFolderTreeItem, CardTemplateTreeItem, CardStylingTreeItem, AnyNoteTypeItem } from './models/note-type-tree-items';

export class NoteTypesTreeProvider implements vscode.TreeDataProvider<AnyNoteTypeItem> {

    constructor(private readonly ankiConnect: AnkiConnect) { };
    
    private _onDidChangeTreeData: vscode.EventEmitter<AnyNoteTypeItem | undefined | null | void> = new vscode.EventEmitter<AnyNoteTypeItem | undefined | null | void>();
    onDidChangeTreeData: vscode.Event<void | AnyNoteTypeItem | AnyNoteTypeItem[] | null | undefined> | undefined = this._onDidChangeTreeData.event;

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: AnyNoteTypeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: AnyNoteTypeItem | undefined): Thenable<AnyNoteTypeItem[]> {

        if (element === undefined)
            // return list of tree items for all note types
            return this.ankiConnect.getModelNames()
            .then(modelNames => {
                // console.log(modelNames);
                return Promise.resolve(modelNames.map(name => new NoteTypeTreeItem(name, vscode.TreeItemCollapsibleState.Collapsed)))
            });

        else if (typeof element.label === "string" && element instanceof NoteTypeTreeItem)
            // return list of card templates in the given note type
            return this.ankiConnect.getModelTemplates(element.label)
            .then(modelTemplates => {
                // console.log(modelTemplates);
                return Promise.resolve(
                    Object.keys(modelTemplates).map(cardName => new CardFolderTreeItem(cardName, element, vscode.TreeItemCollapsibleState.Collapsed))
                    .concat(new CardStylingTreeItem(element))
                );
            });

        else if (element instanceof CardFolderTreeItem)
            return Promise.resolve([
                new CardTemplateTreeItem("Front", element),
                new CardTemplateTreeItem("Back", element)
            ]);

        return Promise.resolve([]);
    }

}
