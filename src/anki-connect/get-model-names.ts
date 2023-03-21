import { ApiKey, invoke } from "@autoanki/anki-connect";

export const getModelNames = async (origin?: string, key?: ApiKey): Promise<string[]> =>
    await invoke({
        action: "modelNames",
        version: 6,
        request: undefined,
        origin,
        key
    });
