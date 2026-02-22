import { useCallback, useState } from 'react';

export const useBooleanState = (defaultValue?: boolean) => {
  const [isOn, setIsOn] = useState(defaultValue ?? false);

  const on = useCallback(() => setIsOn(true), []);
  const off = useCallback(() => setIsOn(false), []);
  const toggle = useCallback(() => setIsOn((prev) => !prev), []);

  return [isOn, on, off, toggle] as const;
};
