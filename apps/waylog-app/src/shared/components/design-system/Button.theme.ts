export type ButtonVariant = 'contained' | 'outlined' | 'text'
export type ButtonColor = 'primary' | 'error' | 'inherit'

interface ButtonThemeColors {
  primary: string
  danger: string
  onPrimary: string
  onSurface: string
}

export function resolveButtonColors(
  variant: ButtonVariant,
  color: ButtonColor,
  theme: ButtonThemeColors,
) {
  const mainColor = color === 'error'
    ? theme.danger
    : color === 'inherit'
      ? theme.onSurface
      : theme.primary

  return {
    backgroundColor: variant === 'contained' ? mainColor : 'transparent',
    borderColor: variant === 'outlined' ? mainColor : 'transparent',
    borderWidth: variant === 'outlined' ? 1 : 0,
    textColor: variant === 'contained' ? theme.onPrimary : mainColor,
  }
}
