import * as vscode from 'vscode';
import { LanguageId } from '../models/embedded-languages';

export type EmbeddedDocument = {
    languageId: LanguageId,
    content: string,
    virtualUri: vscode.Uri
}
