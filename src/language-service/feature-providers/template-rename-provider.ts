import * as vscode from 'vscode';
import { TEMPLATE_LANGUAGE_ID } from '../../constants';
import { documentRange } from '../document-util';
import { AstItemType, ConditionalEnd, ConditionalStart, Replacement } from '../parser/ast-models';
import { inItem } from '../parser/ast-utils';
import { parseTemplateDocument } from '../parser/template-parser';
import LanguageFeatureProviderBase from './language-feature-provider-base';

export default class TemplateRenameProvider extends LanguageFeatureProviderBase implements vscode.RenameProvider {
    
    async provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): Promise<vscode.WorkspaceEdit | null | undefined> {
        const embeddedDocument = this.getEmbeddedByPosition(document, position);

        if (!embeddedDocument)
            return undefined;

        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {
            // Anki template rename
            const templateDocument = parseTemplateDocument(embeddedDocument.content);

            // Provide rename for conditional templates
            const conditional = getConditionalAtOffset(templateDocument.replacements, document.offsetAt(position));
            
            if (!conditional?.fieldSegment.field)
                return Promise.reject("Conditional not found at this position, or conditional contains no field name.");
            
            const { field } = conditional.fieldSegment;
                
            const workspaceEdit = new vscode.WorkspaceEdit();

            workspaceEdit.replace(document.uri, documentRange(document, field.start, field.end), newName);

            if (conditional.linkedTag?.fieldSegment.field) {
                const { field: linkedField } = conditional.linkedTag.fieldSegment;
                workspaceEdit.replace(document.uri, documentRange(document, linkedField.start, linkedField.end), newName);
            }

            return workspaceEdit;
        }

        // hmtl, javascript, css forwarding

        const htmlDocument = this.getEmbeddedByLanguage(document, "html");

        if (!htmlDocument)
            return undefined;

        const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
            'vscode.executeDocumentRenameProvider',
            htmlDocument.virtualUri,
            position,
            newName
        );
        
        edit.entries().forEach(([uri, textEdits]) => {
            edit.set(document.uri, textEdits);
        });

        return edit;
    }

    async prepareRename(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Range | { range: vscode.Range; placeholder: string; } | null | undefined> {
        
        const embeddedDocument = this.getEmbeddedByPosition(document, position);

        if (!embeddedDocument)
            return undefined;
        
        if (embeddedDocument.languageId === TEMPLATE_LANGUAGE_ID) {
            // Anki template prepare rename
            const templateDocument = parseTemplateDocument(embeddedDocument.content);
            
            // Provide rename prepare for conditional templates
            const conditional = getConditionalAtOffset(templateDocument.replacements, document.offsetAt(position));
            
            if (!conditional?.fieldSegment.field)
                return Promise.reject("Renames can only be performed on field names in a conditional template.");

            const { field } = conditional.fieldSegment;
            
            return {
                range: documentRange(document, field.start, field.end),
                placeholder: field.content
            };
        }

        // hmtl, javascript, css forwarding

        const htmlDocument = this.getEmbeddedByLanguage(document, "html");

        if (!htmlDocument)
            return undefined;

        // For some reason we have to open the document before executing the
        // vscode.prepareRename or vscode.executeDocumentRenameProvider commands, 
        // otherwise it throws an "Unexpected type" error.
        const openedDocument = await vscode.workspace.openTextDocument(htmlDocument.virtualUri);
        
        const res = await vscode.commands.executeCommand<vscode.Range>(
            'vscode.prepareRename',
            htmlDocument.virtualUri,
            position
        );

        return res;

    }
    
}

const getConditionalAtOffset = (replacements: Replacement[], offset: number): ConditionalStart | ConditionalEnd | undefined =>
    replacements.find((replacement): replacement is ConditionalStart | ConditionalEnd => 
        (replacement.type === AstItemType.conditionalStart || replacement.type === AstItemType.conditionalEnd) &&
        replacement.fieldSegment.field !== undefined &&
        inItem(replacement.fieldSegment.field, offset));
