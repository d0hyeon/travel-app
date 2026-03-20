import { Typography, type TypographyProps } from "@mui/material";
import { type ReactNode } from "react";
import { useCountAnimation, type CountAnimationOptions } from "~shared/hooks/useCountdownAnimation";

type Props = {
  value: number;
  format?: (value: number) => ReactNode;
  onAnimationEnd?: () => void;
} & TypographyProps & Omit<CountAnimationOptions, 'onEnd'>

export function AnimatedCountText({
  value,
  format = (v) => v.toLocaleString(),
  sx,
  delay,
  duration,
  durationTarget,
  enabled,
  onAnimationEnd,
  ...props
}: Props) {
  const number = useCountAnimation(value, {
    duration,
    durationTarget,
    delay,
    enabled,
    onEnd: onAnimationEnd
  });

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