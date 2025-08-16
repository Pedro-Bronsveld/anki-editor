import * as vscode from 'vscode';
import { toInitialUri } from '../virtual-uris';

export default class VirtualQuickDiffProvider implements vscode.QuickDiffProvider {
    
    provideOriginalResource(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Uri> {
        return toInitialUri(uri);
    }

}
