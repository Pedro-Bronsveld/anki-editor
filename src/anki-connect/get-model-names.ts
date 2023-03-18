import { invoke } from "./invoke";

export const getModelNames = async (origin?: string, key?: string): Promise<string[]> => {
    return await invoke({
            action: "modelNames",
            version: 6,
            request: undefined,
            origin,
            key
        });
}
