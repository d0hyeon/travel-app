import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, Suspense } from 'react'
import chatHandlers from './tripChat.mock'
import { useTripChat } from './useTripChat'
import { MOCK_TRIP_ID } from '~features/trip/trip.mock'

// Supabase Realtime WebSocket이 테스트 환경에서 crash하지 않도록 mock
vi.mock('~api/client', async (importOriginal) => {
  const mod = await importOriginal<typeof import('~api/client')>()
  const fakeChannel = { on: () => fakeChannel, subscribe: () => fakeChannel }
  mod.supabase.channel = () => fakeChannel as ReturnType<typeof mod.supabase.channel>
  mod.supabase.removeChannel = vi.fn().mockResolvedValue('ok')
  return mod
})

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
