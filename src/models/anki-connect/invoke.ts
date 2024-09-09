/**
 * extracted from https://github.com/chenlijun99/autoanki/blob/main/packages/anki-connect/src/index.ts
 */

import { ActionNames, AnkiConnectActions } from "./actions";
import { ApiKey } from "./api-key";
import { DefaultAnkiConnectVersion, SupportedAnkiConnectVersions } from "./versions";

export type InvokeArgs<
  ActionName extends ActionNames,
  VersionNumber extends SupportedAnkiConnectVersions = DefaultAnkiConnectVersion,
  RequestParams = AnkiConnectActions[ActionName][VersionNumber]['request']
> = {
    action: ActionName;
    version?: VersionNumber;
    origin?: string;
    key?: ApiKey;
} & (
RequestParams extends void
    ? {
        request?: undefined;
    }
    : {
        request: RequestParams;
    }
);

export type InvokeResponse<
  ActionName extends ActionNames,
  VersionNumber extends SupportedAnkiConnectVersions = DefaultAnkiConnectVersion
> = AnkiConnectActions[ActionName][VersionNumber]['response'];
