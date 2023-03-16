import { TEMPLATE_LANGUAGE_ID } from "../constants";

export const embeddedLanguages = {
    "html": "html",
    "css": "css",
    "javascript": "js",
    [TEMPLATE_LANGUAGE_ID]: "template.anki"
} as const;
