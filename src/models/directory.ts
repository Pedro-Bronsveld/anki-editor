import * as vscode from "vscode";
import File from "./file";

export default class Directory implements vscode.FileStat {
    type: vscode.FileType = vscode.FileType.Directory;
    ctime: number = Date.now();
    mtime: number = Date.now();
    size: number = 0;

    entries: Map<string, File | Directory> = new Map();

    constructor(public readonly name: string) {}
}