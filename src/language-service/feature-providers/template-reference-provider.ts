import * as vscode from 'vscode';
import { ANKI_EDITOR_SCHEME_BASE, TEMPLATE_LANGUAGE_ID } from '../../constants';
import { RequiredProp } from '../../models/required-prop';
import { partsToUri, uriPathToParts } from '../../note-types/uri-parser';
import { documentRange } from '../document-util';
import { AstItemType, FilterSegment, TemplateDocument } from '../parser/ast-models';
import { getItemAtOffset, inItem } from '../parser/ast-utils';
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

            if (!replacement)
                return;
            
            const sourceItem = replacement.fieldSegment.field && inItem(replacement.fieldSegment.field, offset)
                ? replacement.fieldSegment.field
                : replacement.type === AstItemType.replacement ? getItemAtOffset(replacement.filterSegments, offset)?.filter : undefined;

            if (!sourceItem)
                return;
                
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

            // Get all references to source item
            const allLocations: vscode.Location[] = [];

            for (const { document, template } of templateDocuments) {
                for (const replacement of template.replacements) {

                    const otherItems = sourceItem.type === AstItemType.field
                        ? [replacement.fieldSegment.field]
                        : replacement.type === AstItemType.replacement ? replacement.filterSegments
                            .filter((filterSegment): filterSegment is RequiredProp<FilterSegment, "filter"> =>
                                filterSegment.filter !== undefined && filterSegment.filter.content === sourceItem.content)
                            .map(({ filter }) => filter) : [];
                    
                    for (const otherItem of otherItems) {
                        if (!otherItem)
                            continue;

                        const location = new vscode.Location(document.uri, documentRange(document, otherItem.start, otherItem.end));
                        
                        allLocations.push(location);
                    }
                    
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