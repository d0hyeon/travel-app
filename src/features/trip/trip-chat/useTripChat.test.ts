import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, Suspense } from 'react'
import chatHandlers from './tripChat.mock'
import { useTripChat } from './useTripChat'
import { MOCK_TRIP_ID } from '~features/trip/trip.mock'

const server = setupServer(...chatHandlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(Suspense, { fallback: null }, children)
  )
}

describe('useTripChat', () => {
  it('tripId로 메시지 목록을 반환한다', async () => {
    const { result } = renderHook(() => useTripChat(MOCK_TRIP_ID), { wrapper })
    await waitFor(() => expect(result.current.messages).toHaveLength(2))
    expect(result.current.messages[0].content).toBe('안녕하세요!')
  })
})
