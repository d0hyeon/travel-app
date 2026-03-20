import { lazy as reactLazy } from 'react'

type Loader = () => Promise<any>

export function lazy<L extends Loader>(loader: L) {
  const Component = reactLazy(() => loader());

  return Object.assign(Component, {
    preload: async () => {
      const module = await loader();
      if (module.preload instanceof Function) module.preload();
      
      return module;
    }
  })
}