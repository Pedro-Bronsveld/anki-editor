import { InvokeResponse } from "@autoanki/anki-connect";
import { wrappedInvoke } from "./wrapper-invoke";
import axios, { AxiosResponse } from "axios";

type RequestPermissionRequestBody = {
    action: "requestPermission",
    version: 6
}

type RequestPermissionResponseBody = {
    result: {
        permission: "granted",
        requireApiKey: boolean,
        version: 6
    } | {
        permission: "denied"
    },
    error: null
}

export const requestPermission = async (origin?: string): Promise<RequestPermissionResponseBody["result"]> => 
    (await axios.post<RequestPermissionResponseBody, AxiosResponse<RequestPermissionResponseBody>, RequestPermissionRequestBody>(origin ?? "http://127.0.0.1:8765", {
        action: "requestPermission",
        version: 6
    },{
        headers: {
            "Content-Type": "text/plain"
        }
    })).data.result;
