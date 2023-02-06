import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import VirtualDocumentProvider from './virtual-documents-provider';

export default class TemplateSemanticTokenProvider extends LanguageFeatureProviderBase implements vscode.DocumentSemanticTokensProvider {

    constructor(protected virtualDocumentProvider: VirtualDocumentProvider, private tokenLegend: vscode.SemanticTokensLegend) {
        super(virtualDocumentProvider)
    }

    async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens | null | undefined> {
        return undefined;
        const position = new vscode.Position(54, 0);
        const embeddedDocument = super.getEmbeddedByLanguage(document, "javascript");

        if (!embeddedDocument)
            return undefined;
        
        const openedDocument = await vscode.workspace.openTextDocument(embeddedDocument.virtualUri);

        // const legend = await vscode.commands.executeCommand<vscode.SemanticTokensLegend>(
        //     'vscode.provideDocumentSemanticTokensLegend',
        //     embeddedDocument.virtualUri
        // )

        vscode.commands.executeCommand(
            "vscode.open",
            embeddedDocument.virtualUri
        );
        
        const semanticTokens = await vscode.commands.executeCommand<vscode.SemanticTokens>(
            'vscode.provideDocumentSemanticTokens',
            embeddedDocument.virtualUri
        )

        console.log("semanticTokens:", semanticTokens);

        // const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
        // // on line 1, characters 1-5 are a class declaration
        // tokensBuilder.push(
        // new vscode.Range(new vscode.Position(1, 1), new vscode.Position(1, 5)),
        // 'class',
        // ['declaration']
        // );

        return semanticTokens;
        
	    // const templateTokenLegend = new vscode.SemanticTokensLegend(['class', 'interface', 'enum', 'function', 'variable', 'variable.readonly'], ['declaration', 'documentation', 'readonly']);


        // const tokensBuilder = new vscode.SemanticTokensBuilder(this.tokenLegend);
        // // on line 1, characters 1-5 are a class declaration
        // tokensBuilder.push(
        // new vscode.Range(new vscode.Position(1, 1), new vscode.Position(1, 5)),
        // 'variable',
        // ['readonly']
        // );
        // const tokens = tokensBuilder.build();

        // return tokens;
    }


}