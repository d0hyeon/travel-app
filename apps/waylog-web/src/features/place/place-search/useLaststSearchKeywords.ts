import { addDays } from "date-fns";
import { useCallback } from "react";
import { useStorageState } from "~shared/hooks/useStorageState";

interface Options {
  size?: number;
  expireDays?: number;
}

interface Keyword {
  createdAt: number;
  value: string;
}

const now = Date.now();
export function useLaststSearchKeywords({ size = 20, expireDays = 3}: Options = { }) {
  const [keywords, setKeywords] = useStorageState<Keyword[]>('place-search-keywords', [], {
    parse: (data) => {
      const keywords: Keyword[] = JSON.parse(data);
      if (!Array.isArray(keywords)) return [];
      
      return keywords.filter(keyword => {
        const expireDateTime = addDays(now, expireDays).getTime();
        return keyword.createdAt < expireDateTime;
      })
    }
  });

 

  const record = useCallback((value: string) => {
    const keyword = { createdAt: Date.now(), value }
    setKeywords(prev => (
      [keyword, ...prev.filter(x => x.value !== value)].slice(0, size)
    ));
  }, [size, setKeywords]);

  const remove = useCallback((value: string) => {
    setKeywords(prev => prev.filter(x => x.value !== value));
  }, [setKeywords]);

  return {
    data: keywords.map(x => x.value),
    record,
    remove
  };
}
