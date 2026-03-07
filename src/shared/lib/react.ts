import { lazy as reactLazy } from 'react'

type Loader = () => Promise<any>

export function lazy<L extends Loader>(loader: L) {
  const Component = reactLazy(() => loader());

  return Object.assign(Component, {
    preload: loader
  })
}