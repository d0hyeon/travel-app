import { createContext, useContext, type RefObject } from 'react'

export const ScrollContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

export function useScrollContainerRef() {
  return useContext(ScrollContainerContext)
}
