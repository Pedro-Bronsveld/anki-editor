import { wrappedInvoke } from "./wrapper-invoke";

export const requestPermission = async (origin?: string) => 
    wrappedInvoke({
        action: "requestPermission"
    });
