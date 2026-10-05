import { lazy as reactLazy, type ComponentType } from 'react'

type Module<T> = {
  default: T;
  preload?: (...args: any) => (Promise<any>) | void;
}
type Loader = () => Promise<Module<ComponentType<any>>>;
type LoadedComponent<L extends Loader> = Awaited<ReturnType<L>>['default'];
type Preload<L extends Loader> = Awaited<ReturnType<L>>['preload'];

export function lazy<L extends Loader>(loader: L) {
  const Component = reactLazy(() => loader()) as unknown as LoadedComponent<L>;

  return Object.assign(Component, {
    preload: async (...params: Preload<L> extends (...args: infer P) => any ? P : []) => {
      const module = await loader();
      if (module.preload instanceof Function) module.preload(...params);
    }
  });
}
