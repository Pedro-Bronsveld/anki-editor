/**
 * extracted from https://github.com/chenlijun99/autoanki/blob/main/packages/anki-connect/src/index.ts
 */

import { ActionNames } from "../models/anki-connect/actions";
import { InvokeArgs, InvokeResponse } from "../models/anki-connect/invoke";
import { DefaultAnkiConnectVersion, SupportedAnkiConnectVersions } from "../models/anki-connect/versions";

export const invoke = async <
    ActionName extends ActionNames,
    VersionNumber extends SupportedAnkiConnectVersions = DefaultAnkiConnectVersion>
    (args: InvokeArgs<ActionName, VersionNumber>): Promise<InvokeResponse<ActionName, VersionNumber>> => {
    const action = args.action;
    const version = args.version ?? 6;
    const params = args.request;
    const origin = args.origin ?? "http://127.0.0.1:8765";
    const key = args.key;

    const fetchResponse = await fetch(origin, {
        method: "POST",
        headers: action === "requestPermission" ? {
            "Content-Type": "text/plain" // request permission request requires a different content type
        } : {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action,
            version,
            params,
            ...(key !== undefined && {
                key,
            }),
        })
    });

    const responseData = await fetchResponse.json();
    
    if (Object.getOwnPropertyNames(responseData).length !== 2) {
        throw new Error('response has an unexpected number of fields');
    }
    if (responseData === null) {
        throw new Error('anki-connect response is null');
    }
    if (typeof responseData !== "object") {
        throw new Error('anki-connect response did not return an object in its response');
    }
    if (!('error' in responseData)) {
        throw new Error('response is missing required error field');
    }
    if (!('result' in responseData)) {
        throw new Error('response is missing required result field');
    }
    if (responseData.error) {
        throw new Error(`Anki-connect request failed: "${responseData.error}"`);
    }
    return responseData.result;
}
