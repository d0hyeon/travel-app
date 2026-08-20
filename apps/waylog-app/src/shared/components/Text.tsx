import styled from '@emotion/native'
import { fontSize, fontWeight, palette } from '../config/tokens'

// MUI Typography 는 variant 13개를 주지만 웹에서 실제로 쓰이는 것은 5개다.
// body2 67 · caption 45 · body1 29 · subtitle2 29 · h6 14
export type TextVariant = 'h6' | 'subtitle2' | 'body1' | 'body2' | 'caption'

export const Text = styled.Text<{
  variant?: TextVariant
  color?: string
  bold?: boolean
}>`
  font-size: ${({ variant = 'body1' }) => fontSize[variant]}px;
  font-weight: ${({ bold }) => (bold ? fontWeight.bold : fontWeight.regular)};
  color: ${({ color = palette.text }) => color};
`
