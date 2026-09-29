import type { BridgeInterface, BridgeTransport } from "@waylog/bridge";
import { createBridgeHost, type BridgeHost } from "@waylog/bridge/host";
import { useVariation as useStaticValue } from "@waylog/react";
import Constants from "expo-constants";
import { useCallback, useRef } from "react";
import { useSharedValue } from "react-native-reanimated";
import type WebView from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import { useBridgeResolvers } from "./useBridgeResolvers";

interface WebViewBridge {
  attachWebView: (instance: WebView | null) => void;
  bindMessage: (event: WebViewMessageEvent) => void;
}

function createWebViewTransport(webView: WebView): {
  transport: BridgeTransport;
  dispatchMessage: (message: string) => void;
} {
  const listeners = new Set<(message: string) => void>();
  const pendingMessages: string[] = [];
  return {
    transport: {
      send: (message) => webView.postMessage(message),
      subscribe: (listener) => {
        listeners.add(listener);
        pendingMessages.splice(0).forEach(listener);
        return () => listeners.delete(listener);
      },
    },
    dispatchMessage: (message) => {
      if (listeners.size === 0) {
        pendingMessages.push(message);
        return;
      }
      listeners.forEach((listener) => listener(message));
    },
  };
}

const appVersion = Constants.expoConfig?.version ?? "0.0.0";

interface UseWebViewBridgeProps {
  resolvers: Partial<BridgeInterface> | Partial<BridgeInterface>[];
}

export function useWebViewBridge({
  resolvers,
}: UseWebViewBridgeProps): WebViewBridge {
  const [getTransport, setTransport] =
    useStaticValue<ReturnType<typeof createWebViewTransport>>();
  const [getBridge, setBridge] = useStaticValue<BridgeHost>();

  const mergedResolvers = Array.isArray(resolvers)
    ? Object.assign({}, ...resolvers)
    : resolvers;

  const attachWebView = useCallback(
    (instance: WebView | null) => {
      const bridge = getBridge();
      bridge?.dispose();

      if (!instance) {
        setTransport(undefined);
        setBridge(undefined);
        return;
      }

      const transport = createWebViewTransport(instance);
      const bridgeHost = createBridgeHost(transport.transport, {
        appVersion,
        resolvers: mergedResolvers,
      });

      setTransport(transport);
      setBridge(bridgeHost);
    },
    [mergedResolvers],
  );

  const bindMessage = useCallback((event: WebViewMessageEvent) => {
    getTransport()?.dispatchMessage(event.nativeEvent.data);
  }, []);

  return { attachWebView, bindMessage };
}
