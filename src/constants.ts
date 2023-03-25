import { DocumentFilter } from "vscode";

export const TEMPLATE_LANGUAGE_ID = "anki-template";
export const TEMPLATE_EXTENSION = ".template.anki";

export const ANKI_EDITOR_SCHEME_BASE = "anki-editor";
export const ANKI_EDITOR_SCHEME = `${ANKI_EDITOR_SCHEME_BASE}:/`;

export const ANKI_EDITOR_EMBEDDED_SCHEME_BASE = "anki-editor-embedded";
export const ANKI_EDITOR_EMBEDDED_SCHEME = `${ANKI_EDITOR_EMBEDDED_SCHEME_BASE}:/`;

export const TEMPLATE_SELECTOR: DocumentFilter = { language: TEMPLATE_LANGUAGE_ID } as const;
export const STYLING_SELECTOR: DocumentFilter = { language: "css", scheme: ANKI_EDITOR_SCHEME_BASE } as const;
export const EMBEDDED_STYLING_SELECTOR: DocumentFilter = { language: "css", scheme: ANKI_EDITOR_EMBEDDED_SCHEME_BASE } as const;

export const ANKI_EDITOR_CONFIG = "anki-editor";
