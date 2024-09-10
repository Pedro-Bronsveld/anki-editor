import { ApiKey } from "../models/anki-connect/api-key";
import { wrappedInvoke } from "./wrapper-invoke";

export const requestPermission = async (origin?: string, key?: ApiKey) => 
    wrappedInvoke({
        action: "requestPermission",
        origin,
        key
    });
