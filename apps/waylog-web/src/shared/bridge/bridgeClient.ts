import type { BridgeTransport } from "@waylog/bridge";
import { createBridgeClient } from "@waylog/bridge/client";
import { assert } from "@waylog/utility";
import { isServer } from "~app/env";
declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

function createReactNativeWebViewTransport(): BridgeTransport {
  const nativeWebView = window.ReactNativeWebView;
  assert(nativeWebView != null, "웹뷰 환경이 아니에요.");

  return {
    send: (message) => nativeWebView.postMessage(message),
    subscribe: (listener) => {
      const handleMessage = (event: MessageEvent<string>) =>
        listener(event.data);
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    },
  };
}

export function getIsWebViewEnv() {
  if (isServer) return false;
  return window.ReactNativeWebView != null;
}

export const isInWebView = getIsWebViewEnv();
export const bridgeClient = getIsWebViewEnv()
  ? createBridgeClient(createReactNativeWebViewTransport())
  : null;

export function getWebViewBridge() {
  if (isInWebView) {
    assert(bridgeClient != null, "클라이언트가 초기화 되지 않았습니다.");

    return { isInWebView: true, client: bridgeClient } as const;
  }

  return { isInWebView: false, client: null } as const;
}
