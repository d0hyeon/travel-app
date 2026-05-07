import { lazy as reactLazy, type ComponentType } from 'react'

type Module<T> = {
  default: T;
  preload?: (...args: any) => (Promise<any>) | void;
}
type Loader<T> = () => Promise<Module<T>>;

export function lazy<
  T extends ComponentType<any>,
  L extends Loader<T>,
  Preload = Awaited<ReturnType<L>>['preload']
>(loader: L) {
  const Component = reactLazy<T>(() => loader());

  return Object.assign(Component, {
    preload: async(...params: Preload extends (...args: infer P) => any ? P : []) => {
      const module = await loader();
      if (module.preload instanceof Function) module.preload(...params);
    }
  })
}
