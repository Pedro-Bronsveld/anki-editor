import * as vscode from "vscode";

export default class File implements vscode.FileStat {
    type: vscode.FileType = vscode.FileType.File;
	ctime: number = Date.now();
	mtime: number = Date.now();
	size: number = 0;

	data?: Uint8Array;

    constructor(public readonly name: string) {}
}
