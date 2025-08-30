import { sourceControlEnabledInSettings } from "../../source-control/source-control-enabled";
import VirtualSourceControl from "../feature-providers/source-control/virtual-source-control";
import { ToggleableFeature } from "./toggleable-feature";
import VirtualDocumentProvider from '../virtual-documents-provider';

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

}
