import { ApiKey, invoke } from "@autoanki/anki-connect";

export const getModelFieldNames = async (modelName: string, origin?: string, key?: ApiKey): Promise<string[]> =>
    await invoke({
        action: "modelFieldNames",
        version: 6,
        request: {
            modelName
        },
        origin,
        key
    });
