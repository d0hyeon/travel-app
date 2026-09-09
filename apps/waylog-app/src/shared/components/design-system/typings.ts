import { ComponentProps, ElementType } from "react";

export type PropsWithAs<P, As extends ElementType> = P &
  Omit<ComponentProps<As>, keyof P> & { as?: As };

export function toComponent<As extends ElementType>(
  as: As | undefined,
  fallback: ElementType,
) {
  const Component: ElementType = as ?? fallback;

  return Component;
}
