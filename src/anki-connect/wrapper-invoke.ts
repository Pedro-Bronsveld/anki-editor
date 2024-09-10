import { invoke } from './invoke';

 /**
 * Wrapped version of autoanki's invoke function.
 * Adds clarification to errors that they originate from the connection
 * between anki-editor and anki connect.
 */
export const wrappedInvoke: typeof invoke = async (args) =>
    await invoke(args)
        .catch(err => {
            // vscode.window.showErrorMessage(`Anki Editor - ${err}`);
            return Promise.reject(`Anki Editor - ${err}`);
        });
