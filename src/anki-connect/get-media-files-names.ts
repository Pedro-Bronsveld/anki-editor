import { wrappedInvoke } from "./wrapper-invoke";

export const getMediaFilesNames = async (pattern: string): Promise<string[]> =>
    await wrappedInvoke({
        action: "getMediaFilesNames",
        request: {
            pattern
        }
    });
