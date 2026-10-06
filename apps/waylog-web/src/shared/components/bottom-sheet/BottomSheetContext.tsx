import { createContext, useContext, type ReactNode, type RefObject } from 'react';
import type { DragHandlers, DragState } from './useSheetDrag';

interface BottomSheetContextValue {
  isModalMode: boolean;
  handlers: DragHandlers;
  dragState: RefObject<DragState>;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function useBottomSheetContext() {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('BottomSheet compound components must be used within BottomSheet');
  }
  return context;
}

interface BottomSheetProviderProps {
  value: BottomSheetContextValue;
  children: ReactNode;
}

export function BottomSheetProvider({ value, children }: BottomSheetProviderProps) {
  return (
    <BottomSheetContext.Provider value={value}>
      {children}
    </BottomSheetContext.Provider>
  );
}
