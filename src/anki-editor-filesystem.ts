import { invoke } from "@autoanki/anki-connect";
import { ModelTemplates } from "@autoanki/anki-connect/dist/model";
import { TextDecoder } from "util";
import * as vscode from "vscode";
import Directory from "./models/directory";
import { Entry } from "./models/entry";
import File from "./models/file";
import { lookupNoteType } from "./uri-parsers/lookup-note-type";
import { writeNoteType } from "./writers/write-note-type";

export class AnkiEditorFs implements vscode.FileSystemProvider {

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    watch(uri: vscode.Uri, options: { readonly recursive: boolean; readonly excludes: readonly string[]; }): vscode.Disposable {
        console.log("watch", uri.path);
        return new vscode.Disposable(() => { });
    }

    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        console.log("stat", uri.path);
        return this._lookup(uri, false);
    }

    readDirectory(uri: vscode.Uri): Thenable<[string, vscode.FileType][]> {
        console.log("readDirectory", uri.path);

        return this._lookupAsDirectory(uri, false).then(entry => {
            const result: [string, vscode.FileType][] = [];
            for (const [name, child] of entry.entries) {
                result.push([name, child.type]);
            }
            return Promise.resolve(result);
        });
    }

    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        console.log("createDirectory");
        throw new Error("Method not implemented.");
    }

    readFile(uri: vscode.Uri): Thenable<Uint8Array> {
        return this._lookupAsFile(uri, false).then(({ data }) => {
            if (data) {
                return data;
            }
            throw vscode.FileSystemError.FileNotFound();
        }); 
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { readonly create: boolean; readonly overwrite: boolean; }): Thenable<void> {
        console.log("writeFile");

        const parts = uri.path.split("/").filter(part => part);

        if (parts.length === 0)
            throw vscode.FileSystemError.FileNotFound(`Writing to ${uri} is not supported by this extension.`);

        const topFolder = parts[0];

        if (topFolder === "Note Types")
            return writeNoteType(uri, content);
        
        throw vscode.FileSystemError.FileNotFound(`Writing to ${uri} is not supported by this extension.`);
    }

    delete(uri: vscode.Uri, options: { readonly recursive: boolean; }): void | Thenable<void> {
        console.log("delete");
        throw new Error("Method not implemented.");
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { readonly overwrite: boolean; }): void | Thenable<void> {
        console.log("rename");
        throw new Error("Method not implemented.");
    }

    copy?(source: vscode.Uri, destination: vscode.Uri, options: { readonly overwrite: boolean; }): void | Thenable<void> {
        console.log("copy");
        throw new Error("Method not implemented.");
    }

    private async _lookup(uri: vscode.Uri, silent: false): Promise<Entry>;
	private async _lookup(uri: vscode.Uri, silent: boolean): Promise<Entry | undefined>;
	private async _lookup(uri: vscode.Uri, silent: boolean): Promise<Entry | undefined> {
        const parts = uri.path.split("/").filter(part => part)

        if (parts.length === 0) {
            const root = new Directory("Anki Editor");
            ["Note Types"].forEach(dirName => {
                root.entries.set(dirName, new Directory(dirName))
            });
            return root;

        }

        const topFolder = parts[0];

        if (topFolder === "Note Types")
            return await lookupNoteType(uri);
        
        return undefined;
    }

    private async _lookupAsDirectory(uri: vscode.Uri, silent: boolean): Promise<Directory> {
		const entry = await this._lookup(uri, silent);
		if (entry instanceof Directory) {
			return entry;
		}
		throw vscode.FileSystemError.FileNotADirectory(uri);
	}

    private async _lookupAsFile(uri: vscode.Uri, silent: boolean): Promise<File> {
		const entry = await this._lookup(uri, silent);
		if (entry instanceof File) {
			return entry;
		}
		throw vscode.FileSystemError.FileIsADirectory(uri);
	}

}
