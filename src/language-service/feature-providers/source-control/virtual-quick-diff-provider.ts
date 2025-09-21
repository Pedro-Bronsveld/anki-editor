import * as vscode from 'vscode';
import { addScmIdToUri, toInitialUri } from '../virtual-uris';
import VirtualDocumentProvider from '../../virtual-documents-provider';
import VirtualSourceControl from './virtual-source-control';

export default class VirtualQuickDiffProvider implements vscode.QuickDiffProvider {

    constructor(private virtualSourceControl: VirtualSourceControl, private initialDocumentProvider: VirtualDocumentProvider) {}
    
    provideOriginalResource(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Uri> {
        const initialUri = toInitialUri(uri);
        if (this.initialDocumentProvider.has(initialUri))
            return addScmIdToUri(initialUri, this.virtualSourceControl.instanceId);
        return null;
    }

}
