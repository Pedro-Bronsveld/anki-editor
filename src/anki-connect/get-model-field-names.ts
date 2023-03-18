import { invoke } from "@autoanki/anki-connect";

export const getModelFieldNames = async (modelName: string, origin?: string): Promise<string[]> =>
    await invoke({
        action: "modelFieldNames",
        version: 6,
        request: {
            modelName
        },
        origin
    });
