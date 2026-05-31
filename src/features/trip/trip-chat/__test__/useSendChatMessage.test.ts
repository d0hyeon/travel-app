import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { http, HttpResponse } from 'msw'
import { handlers } from '../../../../mocks/handlers'
import { useSendChatMessage } from '../useSendChatMessage'
import { MOCK_TRIP_ID } from '~features/trip/trip.mock'
import { MOCK_SESSION } from '~features/auth/auth.mock'
import { queryClient as appQueryClient } from '~app/query-client'

const server = setupServer(...handlers)
beforeAll(() => {
  server.listen()
  appQueryClient.setQueryData(['auth'], MOCK_SESSION.user)
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useSendChatMessage', () => {
  it('send 호출 후 성공하면 isPending이 false로 돌아온다', async () => {
    const { result } = renderHook(() => useSendChatMessage(MOCK_TRIP_ID), { wrapper })
    expect(result.current.isPending).toBe(false)
    act(() => { result.current.send('테스트') })
    await waitFor(() => expect(result.current.isPending).toBe(false))
  })

  it('send 호출 시 오류가 발생하면 isPending이 false로 돌아온다', async () => {
    server.use(
      http.post('*/rest/v1/trip_messages', () =>
        HttpResponse.json({ error: 'server error' }, { status: 500 })
      )
    )
    const { result } = renderHook(() => useSendChatMessage(MOCK_TRIP_ID), { wrapper })
    act(() => { result.current.send('실패 테스트') })
    await waitFor(() => expect(result.current.isPending).toBe(false))
  })
})
