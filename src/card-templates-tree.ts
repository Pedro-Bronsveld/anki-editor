import { invoke } from '@autoanki/anki-connect';
import * as vscode from 'vscode';
import { TreeItemCollapsibleState } from 'vscode';

type AnkiTemplateItem = NoteType | CardName | CardTemplate | CardStyling;

export class CardTemplatesProvider implements vscode.TreeDataProvider<AnkiTemplateItem> {

    onDidChangeTreeData?: vscode.Event<void | AnkiTemplateItem | AnkiTemplateItem[] | null | undefined> | undefined;

    getTreeItem(element: AnkiTemplateItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: AnkiTemplateItem | undefined): Thenable<AnkiTemplateItem[]> {

        if (element === undefined)
            // return list of note types
            return invoke({
                action: "modelNames",
                version: 6,
                request: undefined
            }).then(modelNames => {
                console.log(modelNames);
                return Promise.resolve(modelNames.map(name => new NoteType(name, vscode.TreeItemCollapsibleState.Collapsed)))
            }).catch(err => {
                console.log(err);
                return Promise.reject([]);
            });

        else if (typeof element.label === "string" && element instanceof NoteType)
            // return list of card templates in the given note type
            return invoke({
                action: "modelTemplates",
                version: 6,
                request: {
                    modelName: element.label
                }
            }).then(modelTemplates => {
                console.log(modelTemplates);
                return Promise.resolve(
                    Object.keys(modelTemplates).map(cardName => new CardName(cardName, String(element.label), vscode.TreeItemCollapsibleState.Collapsed))
                    .concat(new CardName("Styling", String(element.label)))
                );
            }).catch(err => {
                console.log(err);
                return Promise.reject([]);
            });

        else if (element instanceof CardName)
            return Promise.resolve([
                new CardTemplate("Front", element.modelName, String(element.label)),
                new CardTemplate("Back", element.modelName, String(element.label))
            ]);

        return Promise.resolve([]);
    }

    getParent?(element: AnkiTemplateItem): vscode.ProviderResult<AnkiTemplateItem> {
        throw new Error('getParent Method not implemented.');
    }
    
    resolveTreeItem?(item: vscode.TreeItem, element: AnkiTemplateItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('resolveTreeItem Method not implemented.');
    }

}

class NoteType extends vscode.TreeItem {}

class CardName extends vscode.TreeItem {
    constructor(
        label: string,
        public readonly modelName: string,
        collapsibleState?: TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
    }
}

class CardTemplate extends vscode.TreeItem {

    public readonly command = {
        title: "Load Template",
        command: "anki-template-editor.loadTemplate",
        arguments: [this.modelName, this.cardName, this.side]
    }
    
    constructor(
        public readonly side: "Front" | "Back",
        public readonly modelName: string,
        public readonly cardName: string,
        collapsibleState?: TreeItemCollapsibleState
    ) {
        super(`${side} Template`, collapsibleState);
    }
}
class CardStyling extends vscode.TreeItem {}
