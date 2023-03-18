import { invoke } from "@autoanki/anki-connect";

export const getModelNames = async (origin?: string): Promise<string[]> => {
    return await invoke({
            action: "modelNames",
            version: 6,
            request: undefined,
            origin
        });
}
