import type { ReactNode } from "react";

type Props<T extends string | number> = {
  value?: T;
  cases: Partial<Record<T, ReactNode | (() => ReactNode)>>
  defaultComponent?: ReactNode | (() => ReactNode);
}

export function SwitchCase<T extends string | number>({
  value,
  cases,
  defaultComponent
}: Props<T>) {
  const matched = value ? cases[value] ?? defaultComponent : defaultComponent;

  if (matched instanceof Function) {
    return <>{matched()}</>;
  }
  return <>{matched}</>;
};
