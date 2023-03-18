import { ActionNames, InvokeArgs, InvokeResponse } from "@autoanki/anki-connect";
import axios from "axios";

/**
 * Call anki-connect API
 *
 * Temporarily extracted from @autoanki/anki-connect to add key parameter.
 *
 * See https://github.com/microsoft/TypeScript/issues/29131
 */
export async function invoke<
    ActionName extends ActionNames,
    VersionNumber extends 6
>(
    args: Omit<InvokeArgs<ActionName, VersionNumber>, "origin"> & {
        origin?: string;
        key?: string;
    }
): Promise<InvokeResponse<ActionName, VersionNumber>> {
    const action = args.action;
    const version = args.version;
    const params = args.request;
    const origin = args.origin ?? "http://127.0.0.1:8765";

    const response = await axios.post(
        origin,
        JSON.stringify({
            action,
            version,
            params,
            ...(args.key ? { key: args.key } : {}),
        })
    );
    if (Object.getOwnPropertyNames(response.data).length !== 2) {
        throw new Error("response has an unexpected number of fields");
    }
    if (!("error" in response.data)) {
        throw new Error("response is missing required error field");
    }
    if (!("result" in response.data)) {
        throw new Error("response is missing required result field");
    }
    if (response.data.error) {
        throw new Error(
            `Anki-connect request failed: "${response.data.error}"`
        );
    }
    return response.data.result;
}
