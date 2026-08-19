import { Box, styled, type BoxProps } from "@mui/material";
import { useResizableSplit, type UseResizableSplitOptions } from "./useResizableSplit";
import { Children } from "react";
import { assert } from "@waylog/domains/utils";

export function SplitView({
  children,
  direction = 'vertical',
  minRatio,
  maxRatio,
  initialRatio,
  onResizeEnd,
  ...props
}: Omit<BoxProps, 'component'> & UseResizableSplitOptions) {

  const childs = Children.toArray(children)
  assert(childs.length === 2, 'children은 2개의 노드를 배치해주세요');

  const { containerRef, handleProps, ratio } = useResizableSplit({ minRatio, maxRatio, direction, initialRatio, onResizeEnd });
  const sizeKey = direction === 'horizontal' ? 'width' : 'height'

  return (
    <Box ref={containerRef} {...props}>
      <Box {...{ [sizeKey]: `${ratio}%` }}>
        {childs[0]}
      </Box>
      {direction === 'vertical'
        ? <ResizeHandleVertical {...handleProps} />
        : <ResizeHandleHorizontal {...handleProps} />}
      <Box {...{ [sizeKey]: `100% - ${ratio}%` }}>
        {childs[1]}
      </Box>
    </Box>
  )

}

// Styled resize handle components
export const ResizeHandleHorizontal = styled('div')(({ theme }) => ({
  width: 8,
  cursor: 'col-resize',
  backgroundColor: theme.palette.grey[100],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background-color 0.2s',
  touchAction: 'none',
  '&:hover': {
    backgroundColor: theme.palette.grey[300],
  },
  '&::after': {
    content: '""',
    width: 3,
    height: 40,
    borderRadius: 2,
    backgroundColor: theme.palette.grey[400],
  },
}))

export const ResizeHandleVertical = styled('div')(({ theme }) => ({
  height: 8,
  cursor: 'row-resize',
  backgroundColor: theme.palette.grey[100],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background-color 0.2s',
  touchAction: 'none',
  '&:hover': {
    backgroundColor: theme.palette.grey[300],
  },
  '&::after': {
    content: '""',
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.palette.grey[400],
  },
}))
