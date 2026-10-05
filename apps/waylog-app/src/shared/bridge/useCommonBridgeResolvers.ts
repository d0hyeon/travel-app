import type { BridgeInterface } from "@waylog/bridge";
import { readAuthTokens, signOut } from "@waylog/domains/clients";
import { refetchBridgeQueries } from "./refetchQueriesHandler";
import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";

export function useCommonBridgeResolvers() {
  const navigation = useNavigation();

  return useMemo(
    () =>
      ({
        closeWebView: async () => navigation.goBack(),
        refetchQueries: refetchBridgeQueries,
        getAuthTokens: async () => {
          const tokens = await readAuthTokens();
          if (!tokens) throw new Error("로그인 세션이 없습니다.");
          return tokens;
        },
      }) satisfies Partial<BridgeInterface>,
    [navigation],
  );
}
