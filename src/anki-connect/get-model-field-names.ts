import { invoke } from "@autoanki/anki-connect";

export const getModelFieldNames = async (modelName: string): Promise<string[]> =>
    await invoke({
        action: "modelFieldNames",
        version: 6,
        request: {
            modelName
        }
    });
