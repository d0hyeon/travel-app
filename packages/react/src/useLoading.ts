import { useCallback, useState } from "react";

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const start = useCallback(async (callback: () => void) => {
    setIsLoading(true);
    try {
      await callback();
    } finally {
      setIsLoading(false)
    }
  }, []);

  return [isLoading, start] as const;
}