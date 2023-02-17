import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateTypeHierarchyProvider extends LanguageFeatureProviderBase implements vscode.TypeHierarchyProvider {
    
    async prepareTypeHierarchy(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.TypeHierarchyItem | vscode.TypeHierarchyItem[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByPosition(document, position);
        
        const typeHierarchyItems = await vscode.commands.executeCommand<vscode.TypeHierarchyItem[]>(
            'vscode.prepareTypeHierarchy',
            embeddedDocument.virtualUri,
            position,
        );

        return typeHierarchyItems;
    }
    
    async provideTypeHierarchySupertypes(item: vscode.TypeHierarchyItem, token: vscode.CancellationToken): Promise<vscode.TypeHierarchyItem[] | null | undefined> {
        const typeHierarchyItems = await vscode.commands.executeCommand<vscode.TypeHierarchyItem[]>(
            'vscode.provideSupertypes',
            item
        );

        return typeHierarchyItems;
    }
    
    async provideTypeHierarchySubtypes(item: vscode.TypeHierarchyItem, token: vscode.CancellationToken): Promise<vscode.TypeHierarchyItem[] | null | undefined> {
        const typeHierarchyItems = await vscode.commands.executeCommand<vscode.TypeHierarchyItem[]>(
            'vscode.provideSubtypes',
            item
        );

        return typeHierarchyItems;
    }

}