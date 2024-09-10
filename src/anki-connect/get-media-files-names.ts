import { ApiKey } from "../models/anki-connect/api-key";
import { wrappedInvoke } from "./wrapper-invoke";

export const getMediaFilesNames = async (pattern: string, origin?: string, key?: ApiKey): Promise<string[]> =>
    await wrappedInvoke({
        action: "getMediaFilesNames",
        request: {
            pattern
        },
        origin,
        key
    });
