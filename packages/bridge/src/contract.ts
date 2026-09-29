export type BridgeQueryKeyPart = string | number | boolean | null;
export type BridgeQueryKey = BridgeQueryKeyPart[];

export interface RefetchQueriesParams {
  queryKeys: BridgeQueryKey[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface BridgeInterface {
  closeWebView: () => Promise<void>;
  refetchQueries: (params: RefetchQueriesParams) => Promise<void>;
  getAuthTokens: () => Promise<AuthTokens>;
  notifyAuthSignedOut: () => Promise<void>;
}

export type BridgeMethod = Extract<keyof BridgeInterface, string>;

export const bridgeMethods = [
  "closeWebView",
  "refetchQueries",
  "getAuthTokens",
  "notifyAuthSignedOut",
] as const satisfies readonly BridgeMethod[];
export const bridgeVersion = 1;

export interface BridgeInfo {
  bridgeVersion: number;
  appVersion: string;
  methods: BridgeMethod[];
}
