
type Ref<T> = (node: T | null) => void;
export function mergeRef<T>(...refs: Ref<T>[]) {
  return (node: T | null) => {
    if (node != null) {
      refs.forEach((setRef) => setRef(node));
    }
  };
}

export function mergeProps<T extends Record<string, any>>(base: T, override: Partial<T>) {
  return Object.entries(override).reduce((acc, [key, value]) => {
    if (value instanceof Function) {
      const originMethod = acc[key] as (...args: unknown[]) => unknown;
      const overridedMethod = (...args: any) => {
        originMethod?.(...args);
        return value?.(...args);
      };

      return { ...acc, [key]: overridedMethod };
    }

    return { ...acc, [key]: value };
  }, base);
}
