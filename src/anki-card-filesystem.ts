import { invoke } from "@autoanki/anki-connect";
import { ModelTemplates } from "@autoanki/anki-connect/dist/model";
import * as path from 'path';
import { TextDecoder, TextEncoder } from "util";
import * as vscode from "vscode";

export class File implements vscode.FileStat {
    type: vscode.FileType = vscode.FileType.File;
	ctime: number = Date.now();
	mtime: number = Date.now();
	size: number = 0;

	data?: Uint8Array;

    constructor(public readonly name: string) {}
}

export class Directory implements vscode.FileStat {
    type: vscode.FileType = vscode.FileType.Directory;
    ctime: number = Date.now();
    mtime: number = Date.now();
    size: number = 0;

    entries: Map<string, File | Directory> = new Map();

    constructor(public readonly name: string) {}
}

export type Entry = File | Directory;

export class AnkiCardFs implements vscode.FileSystemProvider {

    root = new Directory('');

    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private _bufferedEvents: vscode.FileChangeEvent[] = [];
	private _fireSoonHandle?: NodeJS.Timer;

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

        const parts = uri.path.split("/").filter(part => part)

        if (parts.length === 0)
            throw vscode.FileSystemError.FileNotFound(`Writing to ${uri} is not supported by this extension.`);
        
        const modelName = parts[0];
        const decodedContent = new TextDecoder().decode(content);

        if (parts.length === 2 && parts[1] === "Styling.css") {
            // save style
            return invoke({
                action: "updateModelStyling",
                version: 6,
                request: {
                    model: {
                        name: modelName,
                        css: decodedContent
                    }
                }
            }).then(result => {
                console.log(result);
                return Promise.resolve();
            }).catch(err => {
                console.log(err);
                return Promise.reject(err);
            });
            
        }
        else if (parts.length === 3 && parts[2].endsWith(".html")) {
            // save template
            const cardName = parts[1];
            const side = parts[2].split(".")[0];

            if (side !== "Front" && side !== "Back")
                throw vscode.FileSystemError.FileNotFound(uri);
            
            return invoke({
                action: "updateModelTemplates",
                version: 6,
                request: {
                    model: {
                        name: modelName,
                        templates: {
                            [cardName]: {
                                [side]: decodedContent
                            }
                        } as ModelTemplates
                    }
                }
            }).then(result => {
                console.log(result);
                return Promise.resolve();
            }).catch(err => {
                console.log(err);
                return Promise.reject(err);
            });
        }
        
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

    public async loadNoteTypes(): Promise<void> {

        (await invoke({
            action: "modelNames",
            version: 6,
            request: undefined
        }).then(modelNames => {
            console.log(modelNames);
            return modelNames;
        }).catch(err => {
            console.log(err);
            throw new Error(err);
        })).forEach(modelName => {
            const uri = vscode.Uri.parse(`ankicardfs:${modelName}`);
            const basename = path.posix.basename(uri.path);
            const file = new File(modelName);
            this.root.entries.set(basename, file);
		    this._fireSoon({ type: vscode.FileChangeType.Created, uri });
        });

        this._fireSoon({ type: vscode.FileChangeType.Changed, uri: vscode.Uri.parse("ankicardfs:") });

    }

    private async _lookup(uri: vscode.Uri, silent: false): Promise<Entry>;
	private async _lookup(uri: vscode.Uri, silent: boolean): Promise<Entry | undefined>;
	private async _lookup(uri: vscode.Uri, silent: boolean): Promise<Entry | undefined> {

        const parts = uri.path.split("/").filter(part => part)

        if (parts.length === 0) {
            // Root, return list of note types directories
            console.log("fetching modelNames");

            const modelNames = await invoke({
                action: "modelNames",
                version: 6,
                request: undefined
            }).catch(err => {
                console.log(err);
                throw new Error(err);
            })

            const rootDir = new Directory("");
            modelNames.forEach(modelName => {
                rootDir.entries.set(modelName, new Directory(modelName));
            });

            return rootDir;

        }
        else if (parts.length === 1) {
            // note type model, return list of card directories and stylesheet file
            
            const modelName = parts[0];
            const modelTemplates = await invoke({
                action: "modelTemplates",
                version: 6,
                request: {
                    modelName
                }
            }).catch(err => {
                console.log(err);
                throw new Error(err);
            });

            const noteTypeDir = new Directory(modelName);
            Object.keys(modelTemplates).forEach(cardName => {
                noteTypeDir.entries.set(cardName, new Directory(cardName));
            });
            noteTypeDir.entries.set("Styling.css", new File("Styling.css"));

            return noteTypeDir;
        }
        else if (parts.length === 2) {

            const modelName = parts[0];
            const part = parts[1];

            // File is stylesheet
            if (part === "Styling.css") {
                return await invoke({
                    action: "modelStyling",
                    version: 6,
                    request: {
                        modelName
                    }
                }).then(styling => {
                    const file = new File(part);
                    file.data = new TextEncoder().encode(styling.css);
                    return file;
                }).catch(err => {
                    console.log(err);
                    throw new Error(err);
                })
            }
            
            // Directory with card templates
            const cardName = part;
            const cardTemplateDir = new Directory(cardName);
            ["Front", "Back"].forEach(side => {
                const fileName = `${side}.html`;
                cardTemplateDir.entries.set(fileName, new File(fileName));
            });

            return cardTemplateDir;
        }
        else if (parts.length === 3) {
            const modelName = parts[0];
            const cardName = parts[1];
            const sideFileName = parts[2];
            const side = sideFileName.split(".")[0];

            if (side !== "Front" && side !== "Back")
                throw vscode.FileSystemError.FileNotFound(uri);

            const modelTemplates = await invoke({
                action: "modelTemplates",
                version: 6,
                request: {
                    modelName
                }
            }).catch(err => {
                console.log(err);
                throw new Error(err);
            });

            const card = modelTemplates[cardName];
            if (!card)
                throw vscode.FileSystemError.FileNotFound(uri);

            const file = new File(sideFileName);
            file.data = new TextEncoder().encode(card[side]);

            return file;
            
        }

		// const parts = uri.path.split('/');
        // let entry: Entry = this.root;
        
        // for (const part of parts) {
        //     if (!part) {
        //         continue;
        //     }
        //     let child: Entry |  undefined;
        //     if (entry instanceof Directory) {
        //         child = entry.entries.get(part);
        //     }
        //     if (!child) {
		// 		if (!silent) {
		// 			throw vscode.FileSystemError.FileNotFound(uri);
		// 		} else {
		// 			return undefined;
		// 		}
		// 	}
		// 	entry = child;
        // }
        //
        // return entry

        throw vscode.FileSystemError.FileNotFound(uri);
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

    private _fireSoon(...events: vscode.FileChangeEvent[]): void {
		this._bufferedEvents.push(...events);

		if (this._fireSoonHandle) {
			clearTimeout(this._fireSoonHandle);
		}

		this._fireSoonHandle = setTimeout(() => {
			this._emitter.fire(this._bufferedEvents);
			this._bufferedEvents.length = 0;
		}, 5);
	}

}
