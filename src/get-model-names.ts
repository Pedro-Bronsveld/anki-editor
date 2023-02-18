import { invoke } from "@autoanki/anki-connect"

const getModelnames = async (): Promise<string[]> =>
    await invoke({
        action: "modelNames",
        version: 6,
        request: undefined
    });
