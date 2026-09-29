import { supabase } from "@waylog/domains/clients";
import { useAsyncEffect } from "@waylog/react";
import { useState } from "react";
import { getWebViewBridge } from "./bridgeClient";

export function useSyncAppSession() {
  const { isInWebView, client: bridgeClient } = getWebViewBridge();
  const [isLoading, setIsLoading] = useState(bridgeClient != null);

  useAsyncEffect(async () => {
    if (!isInWebView) return;

    try {
      await bridgeClient.ready();
      const { accessToken, refreshToken } = await bridgeClient.getAuthTokens();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading };
}
