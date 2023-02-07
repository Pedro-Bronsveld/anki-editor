import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateDefinitionProvider extends LanguageFeatureProviderBase implements vscode.DefinitionProvider {
    
    async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | vscode.LocationLink[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByLanguage(document, "javascript");
        
        if (!embeddedDocument)
            return;
        
        const definition = await vscode.commands.executeCommand<vscode.Definition | vscode.LocationLink[]>(
            'vscode.executeDefinitionProvider',
            embeddedDocument.virtualUri,
            position
        );

        if (definition instanceof vscode.Location)
            return definition;

        const definitions = definition.map(loc => loc instanceof vscode.Location 
            ? new vscode.Location(document.uri, loc.range)
            : <vscode.LocationLink>{
                ...loc,
                targetUri: document.uri
            });

        const locations = definitions.filter((loc): loc is vscode.Location => loc instanceof vscode.Location);

        if (locations.length > 0)
            return locations;
        
        return definitions.filter((loc): loc is vscode.LocationLink => "targetUri" in loc);
    }

}