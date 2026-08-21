import styled from '@emotion/native'
import type { ReactNode } from 'react'
import { controlHeight, fontSize, fontWeight, palette, radius } from '../config/tokens'

// 웹에서 contained 33 · outlined 23 · text 12 로 셋 다 쓰인다.
// size 도 medium 42 · small 14 · large 12 로 셋 다 쓰인다.
export type ButtonVariant = 'contained' | 'outlined' | 'text'
export type ButtonSize = 'sm' | 'md' | 'lg'

const sizeRadius: Record<ButtonSize, number> = {
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
}

const labelSize: Record<ButtonSize, number> = {
  sm: fontSize.caption,
  md: fontSize.body2,
  lg: fontSize.body1,
}

const Root = styled.Pressable<{ variant: ButtonVariant; size: ButtonSize; disabled?: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: ${({ size }) => controlHeight[size]}px;
  border-radius: ${({ size }) => sizeRadius[size]}px;
  padding-horizontal: ${({ size }) => (size === 'sm' ? 8 : size === 'md' ? 12 : 16)}px;
  background-color: ${({ variant }) =>
    variant === 'contained' ? palette.primary : 'transparent'};
  border-width: ${({ variant }) => (variant === 'outlined' ? 1 : 0)}px;
  border-color: ${palette.primary};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`

const Label = styled.Text<{ variant: ButtonVariant; size: ButtonSize }>`
  font-size: ${({ size }) => labelSize[size]}px;
  font-weight: ${fontWeight.bold};
  color: ${({ variant }) => (variant === 'contained' ? '#fff' : palette.primary)};
`

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  onPress?: () => void
}

export function Button({
  children,
  variant = 'contained',
  size = 'md',
  disabled,
  onPress,
}: ButtonProps) {
  return (
    <Root variant={variant} size={size} disabled={disabled} onPress={disabled ? undefined : onPress}>
      <Label variant={variant} size={size}>
        {children}
      </Label>
    </Root>
  )
}
