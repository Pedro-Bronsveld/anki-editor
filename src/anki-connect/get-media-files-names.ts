import { invoke } from "@autoanki/anki-connect";

export const getMediaFilesNames = async (pattern: string): Promise<string[]> =>
    await invoke({
        action: "getMediaFilesNames",
        version: 6,
        request: {
            pattern
        }
    });
