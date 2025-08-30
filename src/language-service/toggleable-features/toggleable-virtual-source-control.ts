import * as vscode from 'vscode';
import { sourceControlEnabledInSettings } from "../../source-control/source-control-enabled";
import VirtualSourceControl from "../feature-providers/source-control/virtual-source-control";
import { ToggleableFeature } from "./toggleable-feature";
import VirtualDocumentProvider from '../virtual-documents-provider';
import { ANKI_EDITOR_SCHEME_BASE } from '../../constants';
import { toInitialUri } from '../feature-providers/virtual-uris';

export class ToggleableVirtualSourceControl extends ToggleableFeature<VirtualSourceControl> {

    constructor(private initialDocumentProvider: VirtualDocumentProvider) {
        super();
    }

    public enabledInSettings(): boolean {
        return sourceControlEnabledInSettings();
    }
    
    protected createFeature(): VirtualSourceControl {
        return new VirtualSourceControl(this.initialDocumentProvider);
    }

    public activate(): void {
        super.activate();
        const openDocuments = vscode.workspace.textDocuments
            .filter(document => document.uri.scheme === ANKI_EDITOR_SCHEME_BASE
                && !document.uri.query
                && !document.uri.fragment
            );
        
        for (const document of openDocuments) {
            this.initialDocumentProvider.setDocumentContent(toInitialUri(document.uri), document.getText(), false)
        }
        this.feature?.updateResourceGroupResources();
    }

    public deactivate(): void {
        this.feature?.commitAllChanges();
        super.deactivate();
    }

}
