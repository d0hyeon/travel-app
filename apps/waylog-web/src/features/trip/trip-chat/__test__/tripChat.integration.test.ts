import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, Suspense } from 'react'
import { handlers } from '../../../../mocks/handlers'
import { useTripChatMessages } from '../useTripChatMessages'
import { getUnreadCount, markAsRead, getLastReadAt } from '../useUnreadChatCount'
import { MOCK_MESSAGES } from '../tripChat.mock'
import { MOCK_TRIP_ID } from '~features/trip/trip.mock'
import { MOCK_SESSION } from '~features/auth/auth.mock'
import { queryClient as appQueryClient } from '~app/query-client'

// ────────────────────────────────────────────────────────────
// 무엇을 테스트하는가
//
// trip-chat 기능의 전체 흐름:
//   1. 메시지 목록 조회 — getChatMessages가 ChatMessage[]로 변환
//   2. 메시지 전송 — sendChatMessage가 auth 유저 ID를 포함해서 전송
//   3. 안읽음 카운트 — markAsRead 기준으로 이후 메시지만 카운트
//   4. Realtime 수신 — setQueryData로 메시지가 즉시 추가됨
// ────────────────────────────────────────────────────────────

vi.mock('@waylog/domains/api', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@waylog/domains/api')>()
  const fakeChannel = { on: () => fakeChannel, subscribe: () => fakeChannel }
  mod.supabase.channel = () => fakeChannel as unknown as ReturnType<typeof mod.supabase.channel>
  mod.supabase.removeChannel = vi.fn().mockResolvedValue('ok')
  return mod
})

const server = setupServer(...handlers)
beforeAll(() => {
  server.listen()
  appQueryClient.setQueryData(['auth'], MOCK_SESSION.user)
})
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(Suspense, { fallback: null }, children)
  )
}

describe('trip-chat 통합', () => {
  describe('메시지 목록 조회', () => {
    it('tripId로 메시지를 camelCase로 변환해서 반환한다', async () => {
      const { result } = renderHook(() => useTripChatMessages(MOCK_TRIP_ID), { wrapper })
      await waitFor(() => expect(result.current.data).toHaveLength(2))

      const [first, second] = result.current.data
      expect(first.id).toBe('msg-001')
      expect(first.tripId).toBe(MOCK_TRIP_ID)
      expect(first.userId).toBe('user-001')
      expect(first.content).toBe('안녕하세요!')
      expect(first.createdAt).toBe('2026-05-31T10:00:00Z')
      expect(second.content).toBe('반가워요 :)')
    })

    it('메시지가 created_at 오름차순으로 정렬된다', async () => {
      const { result } = renderHook(() => useTripChatMessages(MOCK_TRIP_ID), { wrapper })
      await waitFor(() => expect(result.current.data).toHaveLength(2))

      const times = result.current.data.map((m) => m.createdAt)
      expect(times[0] < times[1]).toBe(true)
    })
  })

  describe('메시지 전송', () => {
    it('전송 성공 후 isPending이 false로 돌아온다', async () => {
      const { result } = renderHook(() => useTripChatMessages(MOCK_TRIP_ID), { wrapper })
      await waitFor(() => expect(result.current.data).toBeDefined())
      act(() => { result.current.send('새 메시지') })
      await waitFor(() => expect(result.current.send.isPending).toBe(false))
    })

    it('서버 오류 시 isPending이 false로 돌아온다', async () => {
      server.use(
        http.post('*/rest/v1/trip_messages', () =>
          HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
        )
      )
      const { result } = renderHook(() => useTripChatMessages(MOCK_TRIP_ID), { wrapper })
      await waitFor(() => expect(result.current.data).toBeDefined())
      act(() => { result.current.send('실패할 메시지').catch(() => {}) })
      await waitFor(() => expect(result.current.send.isPending).toBe(false))
    })
  })

  describe('안읽음 카운트', () => {
    it('lastReadAt 없으면 전체 메시지 수를 반환한다', () => {
      const count = getUnreadCount(MOCK_TRIP_ID, MOCK_MESSAGES.map((m) => ({
        id: m.id,
        tripId: m.trip_id,
        userId: m.user_id,
        userName: m.user_name,
        content: m.content,
        createdAt: m.created_at,
      })))
      expect(count).toBe(2)
    })

    it('markAsRead 이후 새 메시지만 안읽음으로 카운트한다', () => {
      markAsRead(MOCK_TRIP_ID)
      const lastReadAt = getLastReadAt(MOCK_TRIP_ID)!

      const messages = [
        { id: '1', tripId: MOCK_TRIP_ID, userId: 'u', userName: 'u', content: 'old', createdAt: new Date(new Date(lastReadAt).getTime() - 1000).toISOString() },
        { id: '2', tripId: MOCK_TRIP_ID, userId: 'u', userName: 'u', content: 'new', createdAt: new Date(new Date(lastReadAt).getTime() + 1000).toISOString() },
      ]
      expect(getUnreadCount(MOCK_TRIP_ID, messages)).toBe(1)
    })

    it('메시지가 없으면 0을 반환한다', () => {
      expect(getUnreadCount(MOCK_TRIP_ID, [])).toBe(0)
    })
  })

  describe('Realtime 메시지 수신', () => {
    it('setQueryData로 새 메시지를 즉시 추가할 수 있다', async () => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const w = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, createElement(Suspense, { fallback: null }, children))

      const { result } = renderHook(() => useTripChatMessages(MOCK_TRIP_ID), { wrapper: w })
      await waitFor(() => expect(result.current.data).toHaveLength(2))

      const newMessage = {
        id: 'msg-003',
        tripId: MOCK_TRIP_ID,
        userId: 'user-001',
        content: '실시간 메시지',
        createdAt: '2026-05-31T10:02:00Z',
      }

      act(() => {
        queryClient.setQueryData(
          useTripChatMessages.key(MOCK_TRIP_ID),
          (prev: typeof newMessage[]) => [...(prev ?? []), newMessage]
        )
      })

      await waitFor(() => expect(result.current.data).toHaveLength(3))
      expect(result.current.data[2].content).toBe('실시간 메시지')
    })
  })
})
