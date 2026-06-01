import { render, act } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlideReveal } from './SlideReveal';

const mockPlay = vi.fn();
const mockReverse = vi.fn();

vi.mock('~shared/hooks/animation/useAnimation', () => ({
  useAnimation: () => ({ play: mockPlay, reverse: mockReverse }),
}));

vi.mock('~shared/hooks/dom/useElementSize', () => ({
  useElementSize: () => {
    return [{ width: 100, height: 50 }, vi.fn()];
  },
}));

const mockIsMounted = vi.fn(() => false);

vi.mock('~shared/hooks/useIsMounted', () => ({
  useIsMounted: () => mockIsMounted(),
}));

beforeEach(() => {
  mockPlay.mockReset();
  mockReverse.mockReset();
  mockIsMounted.mockReturnValue(false);
});

describe('SlideReveal', () => {
  it('마운트 시 자동으로 열림 애니메이션을 실행한다', () => {
    render(<SlideReveal><div>content</div></SlideReveal>);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it('open=false로 마운트 시 애니메이션을 실행하지 않는다', () => {
    render(<SlideReveal open={false}><div>content</div></SlideReveal>);
    expect(mockPlay).not.toHaveBeenCalled();
    expect(mockReverse).not.toHaveBeenCalled();
  });

  it('open이 true에서 false로 바뀌면 닫힘 애니메이션을 실행한다', () => {
    function Wrapper() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <SlideReveal open={open}><div>content</div></SlideReveal>
          <button onClick={() => setOpen(false)}>close</button>
        </>
      );
    }

    const { getByRole } = render(<Wrapper />);
    mockPlay.mockReset();
    mockIsMounted.mockReturnValue(true);

    act(() => getByRole('button').click());
    expect(mockReverse).toHaveBeenCalledTimes(1);
  });
});
