import * as vscode from 'vscode';
import { ANKI_EDITOR_CONFIG_SOURCE_CONTROL } from '../constants';

export const sourceControlEnabledInSettings = (): boolean => {
    const config = vscode.workspace.getConfiguration(ANKI_EDITOR_CONFIG_SOURCE_CONTROL);
    return config.get<boolean>("enable", true);
}
