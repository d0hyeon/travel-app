export type CloseWebViewParams = Record<never, never>
export type GetAuthTokensParams = Record<never, never>
export type NotifyAuthSignedOutParams = Record<never, never>

export type BridgeQueryKeyPart = string | number | boolean | null
export type BridgeQueryKey = BridgeQueryKeyPart[]

export interface RefetchQueriesParams {
  queryKeys: BridgeQueryKey[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface BridgeContract {
  closeWebView: (params: CloseWebViewParams) => Promise<void>
  refetchQueries: (params: RefetchQueriesParams) => Promise<void>
  getAuthTokens: (params: GetAuthTokensParams) => Promise<AuthTokens>
  notifyAuthSignedOut: (params: NotifyAuthSignedOutParams) => Promise<void>
}

export type BridgeMethod = Extract<keyof BridgeContract, string>

export const bridgeMethods = [
  'closeWebView',
  'refetchQueries',
  'getAuthTokens',
  'notifyAuthSignedOut',
] as const satisfies readonly BridgeMethod[]
export const bridgeVersion = 1

export interface BridgeInfo {
  bridgeVersion: number
  appVersion: string
  methods: BridgeMethod[]
}
