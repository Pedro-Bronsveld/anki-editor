import * as vscode from 'vscode';
import LanguageFeatureProviderBase from './language-feature-provider-base';
import VirtualDocumentProvider from './virtual-documents-provider';
import { createProjectSync, Project, ts } from "@ts-morph/bootstrap";
export default class TemplateSemanticTokenProvider extends LanguageFeatureProviderBase implements vscode.DocumentSemanticTokensProvider {

    private project: Project;
    private tsLanguageService: ts.LanguageService;

    constructor(protected virtualDocumentProvider: VirtualDocumentProvider) {
        super(virtualDocumentProvider);

        this.project = createProjectSync({
            useInMemoryFileSystem: true,
            compilerOptions: {
                allowJs: true,
                checkJs: true
            }
        });

        this.tsLanguageService = this.project.getLanguageService();
    }

    async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens | null | undefined> {
        
        const embeddedDocument = this.getEmbeddedByLanguage(document, "javascript");

        if (!embeddedDocument)
            return undefined;
        
        const fileName = embeddedDocument.virtualUri.toString();

        const jsSourceFile = this.project.createSourceFile(
            fileName,
            embeddedDocument.content,
            {
                scriptKind: ts.ScriptKind.JS
            }
        );
        
        const classifications = this.tsLanguageService.getEncodedSemanticClassifications(fileName, { start: 0, length: embeddedDocument.content.length }, ts.SemanticClassificationFormat.TwentyTwenty);

        this.project.removeSourceFile(jsSourceFile);

        const tokensBuilder = new vscode.SemanticTokensBuilder(tsTokenLegend);
        
        // Token conversion, partially coppied from the implementation in vscode's
        // builtin typescript-language-features extension.
        const { spans } = classifications;
        for (let i = 0; i < spans.length;) {
			const offset = spans[i++];
			const length = spans[i++];
			const tsClassification = spans[i++];

			const tokenType = getTokenTypeFromClassification(tsClassification);
			if (tokenType === undefined) {
				continue;
			}

			const tokenModifiers = getTokenModifierFromClassification(tsClassification);

            const position = document.positionAt(offset);
            tokensBuilder.push(position.line, position.character, length, tokenType, tokenModifiers);

        }

        const tokens = tokensBuilder.build();

        return tokens;
    }


}

// Functions and data from vscode's builtin typescript-language-features extension

const enum TokenType {
	class = 0,
	enum = 1,
	interface = 2,
	namespace = 3,
	typeParameter = 4,
	type = 5,
	parameter = 6,
	variable = 7,
	enumMember = 8,
	property = 9,
	function = 10,
	method = 11,
	_ = 12
}

const enum TokenModifier {
	declaration = 0,
	static = 1,
	async = 2,
	readonly = 3,
	defaultLibrary = 4,
	local = 5,
	_ = 6
}

const enum TokenEncodingConsts {
	typeOffset = 8,
	modifierMask = 255
}

function getTokenTypeFromClassification(tsClassification: number): number | undefined {
	if (tsClassification > TokenEncodingConsts.modifierMask) {
		return (tsClassification >> TokenEncodingConsts.typeOffset) - 1;
	}
	return undefined;
}

function getTokenModifierFromClassification(tsClassification: number) {
	return tsClassification & TokenEncodingConsts.modifierMask;
}

const tokenTypes: string[] = [];
tokenTypes[TokenType.class] = 'class';
tokenTypes[TokenType.enum] = 'enum';
tokenTypes[TokenType.interface] = 'interface';
tokenTypes[TokenType.namespace] = 'namespace';
tokenTypes[TokenType.typeParameter] = 'typeParameter';
tokenTypes[TokenType.type] = 'type';
tokenTypes[TokenType.parameter] = 'parameter';
tokenTypes[TokenType.variable] = 'variable';
tokenTypes[TokenType.enumMember] = 'enumMember';
tokenTypes[TokenType.property] = 'property';
tokenTypes[TokenType.function] = 'function';
tokenTypes[TokenType.method] = 'method';

const tokenModifiers: string[] = [];
tokenModifiers[TokenModifier.async] = 'async';
tokenModifiers[TokenModifier.declaration] = 'declaration';
tokenModifiers[TokenModifier.readonly] = 'readonly';
tokenModifiers[TokenModifier.static] = 'static';
tokenModifiers[TokenModifier.local] = 'local';
tokenModifiers[TokenModifier.defaultLibrary] = 'defaultLibrary';

export const tsTokenLegend = new vscode.SemanticTokensLegend(
        tokenTypes,
        tokenModifiers
    );
