import { useSortable, type UseSortableArguments } from '@dnd-kit/sortable';
import { type PropsWithChildren } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { Box, type BoxProps } from '@mui/material';
import { mergeProps } from '../../utils/merges';

export function SortableItem({ children, ...props }: PropsWithChildren<UseSortableArguments>) {
  const { transform, transition, setNodeRef } = useSortable(props);

  return (
    <Box ref={setNodeRef} sx={{ transform: CSS.Transform.toString(transform), transition }}>
      {children}
    </Box>
  );
}

SortableItem.Handle = ({ children, id, sx, ...props }: Omit<BoxProps, 'id'> & { id: number | string }) => {
  const { attributes, listeners, setActivatorNodeRef } = useSortable({ id });

  return (
    <Box
      ref={setActivatorNodeRef}
      {...mergeProps(props, attributes)}
      onPointerDown={(e) => {
        e.stopPropagation();
        listeners?.onPointerDown?.(e as never);
      }}
      sx={[{ cursor: 'grab', touchAction: 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {children}
    </Box>
  );
};
