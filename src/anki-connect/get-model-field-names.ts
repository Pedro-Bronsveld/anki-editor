import { invoke } from "./invoke";

export const getModelFieldNames = async (modelName: string, origin?: string, key?: string): Promise<string[]> =>
    await invoke({
        action: "modelFieldNames",
        version: 6,
        request: {
            modelName
        },
        origin,
        key
    });
