import * as vscode from 'vscode';
import { TEMPLATE_EXTENSION } from '../constants';
import { escapeText } from '../note-types/escape-uri';
import { partsToUri } from '../note-types/uri-parser';
import { Side } from './template';

export class NoteTypeTreeItem extends vscode.TreeItem {
    iconPath = new vscode.ThemeIcon("preview");
}

export class CardFolderTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        public readonly noteType: NoteTypeTreeItem,
        collapsibleState?: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.resourceUri = partsToUri(["Note Types", label]);
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
        public readonly side: Side,
        public readonly cardFolder: CardFolderTreeItem,
    ) {
        super(partsToUri(["Note Types", String(cardFolder.noteType.label), String(cardFolder.label), `${side}${TEMPLATE_EXTENSION}`]));
        this.label = side;
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
        super(partsToUri(["Note Types", escapeText(String(noteType.label)), "Styling.css"]));
        this.label = "Styling";
    }
}

export type AnyNoteTypeItem = NoteTypeTreeItem | CardFolderTreeItem | CardTemplateTreeItem | CardStylingTreeItem;
