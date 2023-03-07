import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { partsToUri, uriPathToParts } from '../../note-types/uri-parser';
import { documentRange } from '../document-util';
import { TemplateDocument } from '../parser/ast-models';
import { getItemAtOffset } from '../parser/ast-utils';
import { parseTemplateDocument } from '../parser/template-parser';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateReferenceProvider extends LanguageFeatureProviderBase implements vscode.ReferenceProvider {

    async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): Promise<vscode.Location[] | null | undefined> {
        const embeddedDocument = this.getEmbeddedByPosition(document, position);

        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {

            const templateDocument = parseTemplateDocument(embeddedDocument.content);

            // Get field at trigger position
            const offset = document.offsetAt(position);
            const replacement = getItemAtOffset(templateDocument.replacements, offset);

            if (!replacement || !replacement.fieldSegment.field)
                return;

            const sourceField = replacement.fieldSegment.field;

            const templateDocuments: {
                document: vscode.TextDocument,
                template: TemplateDocument
            }[] = [{
                    document: document,
                    template: templateDocument
                }];

            // Try to load references from other side, only when card template is loaded through Anki-Connect
            const includeOtherSide: boolean = document.uri.scheme === ANKI_EDITOR_SCHEME_BASE;
            
            if (includeOtherSide) {
                const uriParts = uriPathToParts(document.uri);

                const thisSide = uriParts[3];
                const otherSide = `${thisSide.startsWith("Front") ? "Back" : "Front"}.template.anki`;

                const otherUriParts = [...uriParts];
                otherUriParts[3] = otherSide;

                const otherUri = partsToUri(otherUriParts);

                const otherDocument = await vscode.workspace.openTextDocument(otherUri);
                const otherAnkiTemplate = this.getEmbeddedByLanguage(otherDocument, TEMPLATE_LANGUAGE_ID);
                if (otherAnkiTemplate)
                    templateDocuments.push({
                        document: otherDocument,
                        template: parseTemplateDocument(otherAnkiTemplate.content)
                    });
            }

            // Get all references to source field name
            const allLocations: vscode.Location[] = [];

            for (const { document, template } of templateDocuments) {
                for (const replacement of template.replacements) {

                    if (!replacement.fieldSegment.field || replacement.fieldSegment.field.content !== sourceField.content)
                        continue;
                    
                    const { field } = replacement.fieldSegment;
                                        
                    const location = new vscode.Location(document.uri, documentRange(document, field.start, field.end));
                    
                    allLocations.push(location);
                }
            }

            return allLocations;
        }

        const locations = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeReferenceProvider',
            embeddedDocument.virtualUri,
            position,
        )
        
        return locations;
    }
}