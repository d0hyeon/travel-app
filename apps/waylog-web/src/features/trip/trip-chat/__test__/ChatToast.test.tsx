import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatToast } from '../ChatToast'

const defaultProps = {
  tripId: 'trip-1',
  message: '안녕하세요!',
  onOpen: vi.fn(),
  onClose: vi.fn(),
}

describe('ChatToast', () => {
  it('메시지를 렌더링한다', () => {
    render(<ChatToast {...defaultProps} open />)
    expect(screen.getByText('안녕하세요!')).toBeTruthy()
  })

  it('open이 false면 렌더링하지 않는다', () => {
    render(<ChatToast {...defaultProps} open={false} />)
    expect(screen.queryByText('안녕하세요!')).toBeNull()
  })

  it('클릭 시 onOpen을 tripId와 함께 호출한다', () => {
    const onOpen = vi.fn()
    render(<ChatToast {...defaultProps} open onOpen={onOpen} />)
    fireEvent.click(screen.getByText('안녕하세요!'))
    expect(onOpen).toHaveBeenCalledWith('trip-1')
  })

  it('클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn()
    render(<ChatToast {...defaultProps} open onClose={onClose} />)
    fireEvent.click(screen.getByText('안녕하세요!'))
    expect(onClose).toHaveBeenCalled()
  })
})
