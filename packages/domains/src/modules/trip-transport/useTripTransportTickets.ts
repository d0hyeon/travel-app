import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assert } from "@waylog/utility";
import { useAuth } from "../../gateways/auth";
import { useAirportArrivalGuidance } from "../airport-arrival-guidance";
import { useFlightStatuses } from "../flight-status";
import { TransportType } from "../transport";
import { useTripMembers, type TripMember } from "../trip-member";
import {
  createTripTransportTicket,
  removeTripTransportTicket,
  updateTripTransportTicket,
  type CreateTripTransportTicket,
  type UpdateTripTransportTicket,
} from "./tripTransport.api";
import type { TripTransport, TripTransportTicket } from "./tripTransport.types";
import { findMyTicket } from "./tripTransport.utils";
import { useTripTransports } from "./useTripTransports";

export interface TripTransportDetailTicket {
  ticket: TripTransportTicket;
  owner: TripMember;
}

export interface TripTransportDetail {
  transport: TripTransport;
  primaryTicket: TripTransportTicket | undefined;
  companionTickets: TripTransportDetailTicket[];
}

interface Props {
  tripId: string;
  transportId: string;
}

export function useTripTransportTickets({ tripId, transportId }: Props) {
  const queryClient = useQueryClient();
  const { data: transports, refetch, ...queries } = useTripTransports(tripId);

  const transport = transports.find((item) => item.id === transportId);
  assert(transport != null, "transport를 찾을 수 없습니다.");

  const invalidateFlightQueries = () => {
    queryClient.invalidateQueries({ queryKey: useFlightStatuses.key() });
    queryClient.invalidateQueries({
      queryKey: useAirportArrivalGuidance.key({
        tripId,
        transportId: transport.id,
      }),
    });
  };

  const add = useMutation({
    mutationFn: (params: CreateTripTransportTicket) =>
      createTripTransportTicket(params),
    onSuccess: () => {
      refetch();
      if (transport.type === TransportType.항공) {
        invalidateFlightQueries();
      }
    },
  });

  const update = useMutation({
    mutationFn: (params: UpdateTripTransportTicket) => {
      return updateTripTransportTicket(params);
    },
    onSuccess: () => {
      refetch();
      if (transport.type === TransportType.항공) {
        invalidateFlightQueries();
      }
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeTripTransportTicket(id),
    onSuccess: () => refetch(),
  });

  const { data: members } = useTripMembers(tripId);
  const { data: auth } = useAuth({ required: false });

  const currentMemberId = members.find(
    (member) => member.userId === auth?.profile.id,
  )?.id;
  const primaryTicket = findMyTicket(transport.tickets, currentMemberId);
  const companionTickets = transport.tickets.flatMap((ticket) => {
    if (ticket.id === primaryTicket?.id || ticket.memberId == null) return [];

    const owner = members.find((member) => member.id === ticket.memberId);
    return owner == null ? [] : [{ ticket, owner }];
  });

  return {
    data: { transport, primaryTicket, companionTickets },
    add: Object.assign(add.mutateAsync, add),
    update: Object.assign(update.mutateAsync, update),
    remove: Object.assign(remove.mutateAsync, remove),
  };
}
