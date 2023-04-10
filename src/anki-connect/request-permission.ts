import { InvokeResponse } from "@autoanki/anki-connect";
import { wrappedInvoke } from "./wrapper-invoke";

export const requestPermission = async (origin?: string) =>
    await wrappedInvoke({
        action: "requestPermission",
        version: 6,
        request: undefined,
        origin
    }) as Omit<InvokeResponse<"requestPermission", 6>, "requireApiKey"> & { requireApikey?: boolean };
