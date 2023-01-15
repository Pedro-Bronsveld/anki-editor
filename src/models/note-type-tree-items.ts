import * as vscode from 'vscode';
import { encodeEscape } from '../note-types/escape-uri';

export class NoteTypeTreeItem extends vscode.TreeItem {
    iconPath = new vscode.ThemeIcon("files");
}

export class CardFolderTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        public readonly noteType: NoteTypeTreeItem,
        collapsibleState?: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.resourceUri = vscode.Uri.parse(`ankieditor:/Note Types/${encodeEscape(label)}`);
        this.iconPath = new vscode.ThemeIcon("symbol-constant");
    }
}

export class CardTemplateTreeItem extends vscode.TreeItem {

    public readonly command = {
        title: "Open Card Template",
        command: "vscode.open",
        arguments: [this.resourceUri]
    }
    
    constructor(
        public readonly side: "Front" | "Back",
        public readonly cardFolder: CardFolderTreeItem,
    ) {
        super(vscode.Uri.parse(`ankieditor:/Note Types/${encodeEscape(String(cardFolder.noteType.label))}/${encodeEscape(String(cardFolder.label))}/${side}.html`));
    }
}
export class CardStylingTreeItem extends vscode.TreeItem {

    public readonly command = {
        title: "Open Card Styling",
        command: "vscode.open",
        arguments: [this.resourceUri]
    }
    
    constructor(
        public readonly noteType: NoteTypeTreeItem,
    ) {
        super(vscode.Uri.parse(`ankieditor:/Note Types/${encodeEscape(String(noteType.label))}/Styling.css`));
    }
}

export type AnyNoteTypeItem = NoteTypeTreeItem | CardFolderTreeItem | CardTemplateTreeItem | CardStylingTreeItem;
