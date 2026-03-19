import { Typography, type TypographyProps } from "@mui/material";
import { type ReactNode } from "react";
import { useCountAnimation } from "~shared/hooks/useCountdownAnimation";

type Props = {
  value: number;
  format?: (value: number) => ReactNode;
  duration?: number;
} & TypographyProps

export function AnimatedCountText({ value, duration, format = (v) => v.toLocaleString(), sx, ...props }: Props) {
  const number = useCountAnimation(value, { duration });

  return (
    <Typography
      {...props}
      sx={{
        fontFeatureSettings: '"tnum"',
        display: 'inline-block',
        textAlign: 'right',
        ...sx
      }}
    >
      {format(number)}
    </Typography>
  )

}