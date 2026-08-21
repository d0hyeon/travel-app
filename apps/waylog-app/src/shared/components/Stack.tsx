import styled from '@emotion/native'

// 웹에서 64회로 가장 많이 쓰인다. gap·direction 만 있으면 대부분 대체된다.
export const Stack = styled.View<{
  direction?: 'row' | 'column'
  gap?: number
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between'
}>`
  flex-direction: ${({ direction = 'column' }) => direction};
  gap: ${({ gap = 0 }) => gap}px;
  align-items: ${({ align = 'stretch' }) => align};
  justify-content: ${({ justify = 'flex-start' }) => justify};
`
