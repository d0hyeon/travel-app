import { lazy as reactLazy } from 'react'

type Module = {
  default: React.ComponentType<any>;
  preload?: (...args: any) => (Promise<any>) | void;
}
type Loader = () => Promise<Module>;

export function lazy<
  L extends Loader,
  Preload = Awaited<ReturnType<L>>['preload']
>(loader: L) {
  const Component = reactLazy(() => loader());

  return Object.assign(Component, {
    preload: async(...params: Preload extends (...args: infer P) => any ? P : []) => {
      const module = await loader();
      if (module.preload instanceof Function) module.preload(...params);
      
      return module;
    }
  })
}