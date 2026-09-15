import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
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
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripTransport.key(tripId),
    queryFn: () => getTripTransports(tripId)
  })

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
