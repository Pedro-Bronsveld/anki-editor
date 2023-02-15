import { DocumentSelector } from "vscode";

export const TEMPLATE_LANGUAGE_ID = "anki-template";
export const TEMPLATE_EXTENSION = ".template.anki";

export const ANKI_EDITOR_SCHEME_BASE = "anki-editor";
export const ANKI_EDITOR_SCHEME = `${ANKI_EDITOR_SCHEME_BASE}:/`;

export const ANKI_EDITOR_EMBEDDED_SCHEME_BASE = "anki-editor-embedded";
export const ANKI_EDITOR_EMBEDDED_SCHEME = `${ANKI_EDITOR_EMBEDDED_SCHEME_BASE}:/`;

export const TEMPLATE_SELECTOR: Readonly<DocumentSelector> = { language: TEMPLATE_LANGUAGE_ID };
