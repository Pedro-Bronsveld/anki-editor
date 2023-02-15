import * as vscode from 'vscode';
import { Position } from 'vscode-html-languageservice';
import { Hover } from 'vscode';

import VirtualDocumentProvider from "./virtual-documents-provider";
import { ANKI_EDITOR_EMBEDDED_SCHEME } from '../constants';

export const runHoverProviderDummy = async (virtualDocumentProvider: VirtualDocumentProvider) => {
    virtualDocumentProvider.setDocumentContent(vscode.Uri.parse(`${ANKI_EDITOR_EMBEDDED_SCHEME}dummy.template.anki`), "<script>console.log()</script>");
	
    for (const pos of [11, 18, 4] as const) {
        await vscode.commands.executeCommand<Hover[]>(
            'vscode.executeHoverProvider',
            vscode.Uri.parse(`${ANKI_EDITOR_EMBEDDED_SCHEME}dummy.template.anki`),
            Position.create(0, pos),
        );
    }
    
    virtualDocumentProvider.clear();
}
