import { Stack, type StackProps } from "@mui/material";
import { useImperativeHandle, useRef, type Ref } from "react";
import { useScrollRestore } from "~shared/hooks/interaction/useScrollRestore";

interface Props extends Omit<StackProps, 'direction' | 'ref'> {
  restorable?: boolean | string;
  direction?: 'vertical' | 'horizontal';
  ref?: Ref<HTMLDivElement | null>;
}

export function Scrollable({
  restorable = false,
  direction = 'vertical',
  sx,
  children,
  ...props
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const styleName = direction === 'vertical' ? 'overflowY' : 'overflowX';

  useScrollRestore({
    element: ref.current,
    key: typeof restorable === 'string' ? restorable : undefined,
    enabled: restorable !== false
  })

  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    props.ref,
    () => ref.current,
    [ref]
  )


  return (
    <Stack
      {...props}
      ref={ref}
      direction={direction === 'vertical' ? "column" : "row"}
      sx={[
        { [styleName]: 'auto' },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      {children}
    </Stack>
  )
}

Scrollable.Vertical = (props: Omit<Props, 'direction'>) => {
  return <Scrollable direction="vertical" {...props} />
}

Scrollable.Horizontal = (props: Omit<Props, 'direction'>) => {
  return <Scrollable direction="horizontal" {...props} />
}