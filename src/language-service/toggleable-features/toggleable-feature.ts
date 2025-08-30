import * as vscode from 'vscode';

export abstract class ToggleableFeature<Feature extends vscode.Disposable> implements vscode.Disposable {

    private _feature: Feature | null = null;
    
    public get feature() : Feature | null {
        return this._feature;
    }

    public activate(): void {
        if (this._feature || !this.enabledInSettings())
            return;
        this._feature = this.createFeature();
    }

    public deactivate(): void {
        if (!this._feature)
            return;
		this._feature.dispose();
		this._feature = null;
    }

    public update(): void {
        if (this.enabledInSettings())
            this.activate();
        else
            this.deactivate();
    }

    public abstract enabledInSettings(): boolean;

    protected abstract createFeature(): Feature;

    dispose() {
        this._feature?.dispose();
    }

}
