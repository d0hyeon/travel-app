import { Box, Stack, type BoxProps, type StackProps } from '@mui/material';
import { useCallback, useRef, type ReactNode } from 'react';
import { useVariation } from '~shared/hooks/extends/useVariation';
import { IntersectionArea } from '../IntersectionArea';
import { useBottomSheetContext } from './BottomSheetContext';
import { useKeyboardStatus } from './useKeyboardStatus';
import { shouldPreventSheetDrag } from './utils';

// --- Header ---

interface HeaderProps extends StackProps {
  children?: ReactNode;
  rightElement?: ReactNode;
}

export function Header({ children, sx, rightElement, ...props }: HeaderProps) {
  const { isModalMode, handlers, dragState } = useBottomSheetContext();
  const isEnableControlRef = useRef(true);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (shouldPreventSheetDrag(e.target)) {
      isEnableControlRef.current = false;
      return;
    }
    e.stopPropagation();
    handlers.onDragStart(e.touches[0].clientY);
    isEnableControlRef.current = true;
  }, [handlers]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isEnableControlRef.current) return;
    const isGestureToBottom = dragState.current.startY < e.touches[0].clientY;
    if (isGestureToBottom) {
      e.stopPropagation();
      handlers.onDragMove(e.touches[0].clientY);
    }
  }, [handlers, dragState]);

  return (
    <Stack

      direction="row"
      alignItems="center"
      justifyContent={children == null ? 'end' : "space-between"}
      paddingX={1.5}
      minHeight={40}
      sx={[
        { flexShrink: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
      onTouchStart={isModalMode ? handleTouchStart : undefined}
      onTouchMove={isModalMode ? handleTouchMove : undefined}
      onTouchEnd={isModalMode ? handlers.onDragEnd : undefined}
    >
      {children}
      {rightElement && <Box>{rightElement}</Box>}

    </Stack>
  );
}

// --- Body ---

interface BodyProps extends BoxProps {
  children: ReactNode;
}

export function Body({ children, sx, ...props }: BodyProps) {
  const { isModalMode, handlers, dragState } = useBottomSheetContext();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [getIsScrolled, setIsScrolled] = useVariation(false);
  const isEnableControlRef = useRef(true);

  const { isOpen: isKeyboardOpen } = useKeyboardStatus();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isKeyboardOpen || getIsScrolled() || shouldPreventSheetDrag(e.target)) {
      isEnableControlRef.current = false;
      return;
    }
    e.stopPropagation();
    handlers.onDragStart(e.touches[0].clientY);
    isEnableControlRef.current = true;
  }, [handlers, isKeyboardOpen, getIsScrolled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const isGestureToBottom = dragState.current.startY < e.touches[0].clientY;
    const isScrolled = getIsScrolled();

    // 스크롤이 발생하면 이 제스처 동안 드래그 컨트롤 비활성화
    if (isScrolled) {
      isEnableControlRef.current = false;
    }

    if (isEnableControlRef.current && isGestureToBottom && !isScrolled) {
      e.stopPropagation();
      handlers.onDragMove(e.touches[0].clientY);
    }
  }, [handlers, dragState, getIsScrolled]);

  return (
    <Box
      {...props}
      className="bottom-sheet-body"
      ref={bodyRef}
      paddingBottom={2}
      height="100%"
      sx={[
        { flex: 1, overflowY: 'auto' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      paddingX={1.5}
      onTouchStart={isModalMode ? handleTouchStart : undefined}
      onTouchMove={isModalMode ? handleTouchMove : undefined}
      onTouchEnd={isModalMode ? handlers.onDragEnd : undefined}
    >
      <IntersectionArea
        root={bodyRef.current}
        onEnter={() => setIsScrolled(false)}
        onLeave={() => setIsScrolled(true)}
      >
        <span />
      </IntersectionArea>
      {children}
    </Box>
  );
}

// --- BottomActions ---

interface BottomActionsProps extends StackProps {
  children: ReactNode;
}

export function BottomActions({ children, sx, ...props }: BottomActionsProps) {
  return (
    <Stack
      width="100%"
      direction="row"
      alignItems="center"
      paddingX={1.5}
      paddingTop={1}
      gap={1}
      paddingBottom="max(env(safe-area-inset-bottom), 8px)"
      borderTop={theme => `1px solid ${theme.palette.divider}`}
      sx={[
        { flexShrink: 0 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Stack>
  );
}

// --- Scrollable (기존 유지) ---

export function Scrollable(props: BoxProps) {
  return <Box data-scrollable="true" {...props} />;
}
