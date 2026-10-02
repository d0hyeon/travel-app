import { arrayIncludes } from "@waylog/utility";
import { supabase } from "../../gateways/client";
import { FlightStatusKind, type FlightStatus } from "./flightStatus.types";
import { toTerminalLabel } from "./incheonFlightStatus.utils";

export interface TripFlightStatusRow {
  transport_id: string;
  kind: string;
  scheduled_at: string | null;
  estimated_at: string | null;
  gate: string | null;
  terminal: string | null;
}

const FLIGHT_STATUS_KINDS = Object.values(FlightStatusKind);

function toFlightStatusKindFromRow(kind: string): FlightStatusKind {
  if (arrayIncludes(FLIGHT_STATUS_KINDS, kind)) return kind;

  return FlightStatusKind.예정;
}

function getIsSameInstant(left: string, right: string) {
  return new Date(left).getTime() === new Date(right).getTime();
}

export function toFlightStatusFromRow(
  row: TripFlightStatusRow,
): FlightStatus | null {
  if (row.scheduled_at == null) return null;

  const hasChangedEstimate =
    row.estimated_at != null &&
    !getIsSameInstant(row.estimated_at, row.scheduled_at);

  return {
    kind: toFlightStatusKindFromRow(row.kind),
    scheduledAt: row.scheduled_at,
    estimatedAt: hasChangedEstimate ? (row.estimated_at ?? undefined) : undefined,
    gate: row.gate ?? undefined,
    terminal: toTerminalLabel(row.terminal ?? undefined),
  };
}

export async function getTripFlightStatuses(
  transportIds: readonly string[],
): Promise<ReadonlyMap<string, FlightStatus>> {
  if (transportIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("trip_transport_flight_status")
    .select("transport_id, kind, scheduled_at, estimated_at, gate, terminal")
    .in("transport_id", [...transportIds]);

  if (error) throw error;

  return (data ?? []).reduce((statuses, row) => {
    const status = toFlightStatusFromRow(row);
    if (status != null) statuses.set(row.transport_id, status);

    return statuses;
  }, new Map<string, FlightStatus>());
}
