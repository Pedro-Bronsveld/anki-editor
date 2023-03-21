import { ApiKey, invoke, InvokeResponse } from "@autoanki/anki-connect";

export const requestPermission = async (origin?: string) =>
    await invoke({
        action: "requestPermission",
        version: 6,
        request: undefined,
        origin
    }) as Omit<InvokeResponse<"requestPermission", 6>, "requireApiKey"> & { requireApikey?: boolean };
