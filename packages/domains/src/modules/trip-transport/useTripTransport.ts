import { keepPreviousData, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { TRIP_PLAN_REFETCH } from '../tripPlanRefetch'
import {
  createTripTransport,
  createTripTransportTicket,
  getTripTransports,
  path,
  removeTripTransport,
  removeTripTransportTicket,
  updateTripTransport,
  type CreateTripTransport,
  type CreateTripTransportTicket,
  type UpdateTripTransport
} from './tripTransport.api'

export function useTripTransport(tripId: string) {
  const { data, refetch, ...queries } = useSuspenseQuery(useTripTransport.query(tripId))

  const { mutateAsync: add } = useMutation({
    mutationFn: (params: Omit<CreateTripTransport, 'tripId'>) => {
      return createTripTransport({ tripId, ...params })
    },
    onSuccess: () => refetch()
  })

  const { mutateAsync: update } = useMutation({
    mutationFn: (params: UpdateTripTransport) => updateTripTransport(params),
    onSuccess: () => refetch()
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: (id: string) => removeTripTransport(id),
    onSuccess: () => refetch()
  })

  const { mutateAsync: addTicket } = useMutation({
    mutationFn: (params: CreateTripTransportTicket) => createTripTransportTicket(params),
    onSuccess: () => refetch()
  })

  const { mutateAsync: removeTicket } = useMutation({
    mutationFn: (id: string) => removeTripTransportTicket(id),
    onSuccess: () => refetch()
  })

  return { data, refetch, add, update, remove, addTicket, removeTicket, ...queries }
}

useTripTransport.key = (tripId: string) => {
  return [path, tripId]
}

useTripTransport.query = (tripId: string) => ({
  queryKey: useTripTransport.key(tripId),
  queryFn: () => getTripTransports(tripId),
  // 무효화 뒤 재조회하는 동안 이전 목록을 그대로 보여준다.
  // 이게 없으면 useSuspenseQuery 가 다시 suspend 해서 화면이 폴백으로 바뀌고,
  // 그 사이 컴포넌트가 다시 마운트되며 진행 중이던 제스처가 끊긴다.
  placeholderData: keepPreviousData,
  ...TRIP_PLAN_REFETCH
})
