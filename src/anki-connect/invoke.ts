/**
 * extracted from https://github.com/chenlijun99/autoanki/blob/main/packages/anki-connect/src/index.ts
 */

import axios from "axios";
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

    const headers = {
        'Accept': 'application/json',
        'Content-Type': action === "requestPermission"
            ? "text/plain" // request permission requires a different content type
            : "application/json"
    }

    const body = {
        action,
        version,
        params,
        ...(key !== undefined && {
            key,
        }),
    }

    if (typeof globalThis.fetch !== "function") {
        // axios request fallback for older VSCode versions
        const axiosResponse = await axios.post(origin,
            body, {
                headers
            }
        )

        if (Object.getOwnPropertyNames(axiosResponse.data).length !== 2) {
            throw new Error('axios response has an unexpected number of fields');
        }
        if (!('error' in axiosResponse.data)) {
            throw new Error('axios response is missing required error field');
        }
        if (!('result' in axiosResponse.data)) {
            throw new Error('axios response is missing required result field');
        }
        if (axiosResponse.data.error) {
            throw new Error(`Anki-connect axios request failed: "${axiosResponse.data.error}"`);
        }
        return axiosResponse.data.result;
    }

    // fetch request
    const fetchResponse = await globalThis.fetch(origin, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
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
