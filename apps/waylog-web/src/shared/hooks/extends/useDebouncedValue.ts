import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value:  T, ms: number) {
  const [state, setState] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => setState(value), ms);
    return () => clearTimeout(timerId);
  }, [value, ms]);

  return state;
}
