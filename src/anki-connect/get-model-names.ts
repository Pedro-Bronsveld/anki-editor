import { ApiKey } from "../models/anki-connect/api-key";
import { wrappedInvoke } from "./wrapper-invoke";

export const getModelNames = async (origin?: string, key?: ApiKey): Promise<string[]> =>
    await wrappedInvoke({
        action: "modelNames",
        version: 6,
        request: undefined,
        origin,
        key
    });
