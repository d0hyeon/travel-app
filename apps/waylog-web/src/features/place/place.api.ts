import { supabase } from "@waylog/domains/api";
import type { UpdateDataType } from "@waylog/domains/api";
import type {
  Place,
  PlaceCategoryType,
  PlaceStatus,
  TripPlace,
} from "./place.types";
import { toTripPlacePatch, type TripPlacePatchInput } from "./place.utils";

export const placeKey = "places";

// ─────────────────────────────────────────
// 변환 헬퍼
// ─────────────────────────────────────────

function toPlace(row: {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  provider: string;
  external_id: string;
  created_at: string;
}): Place {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? "",
    lat: row.lat,
    lng: row.lng,
    provider: row.provider,
    externalId: row.external_id,
    createdAt: row.created_at,
  };
}

function toTripPlace(row: {
  id: string;
  trip_id: string;
  place_id: string;
  status: string;
  category: string | null;
  memo: string | null;
  tags: string[];
  created_at: string;
  places: {
    name: string;
    address: string | null;
    lat: number;
    lng: number;
  };
}): TripPlace {
  return {
    id: row.id,
    placeId: row.place_id,
    tripId: row.trip_id,
    name: row.places.name,
    address: row.places.address ?? "",
    lat: row.places.lat,
    lng: row.places.lng,
    status: row.status as PlaceStatus,
    category: (row.category as PlaceCategoryType) ?? undefined,
    tags: row.tags ?? [],
    memo: row.memo ?? "",
    createdAt: row.created_at,
  };
}

const TRIP_PLACE_SELECT = `
  id, trip_id, place_id, status, category, memo, tags, created_at,
  places!inner(name, address, lat, lng)
` as const;

// ─────────────────────────────────────────
// 전역 Place 조작
// ─────────────────────────────────────────

export async function upsertPlace(
  provider: string,
  externalId: string,
  data: { name: string; address: string; lat: number; lng: number },
): Promise<Place> {
  const { data: inserted, error } = await supabase
    .from("places")
    .upsert(
      {
        provider,
        external_id: externalId,
        name: data.name,
        address: data.address || null,
        lat: data.lat,
        lng: data.lng,
      },
      { onConflict: "provider,external_id", ignoreDuplicates: true },
    )
    .select();

  if (error) throw error;
  if (inserted && inserted.length > 0) return toPlace(inserted[0]);

  const { data: existing, error: selectError } = await supabase
    .from("places")
    .select("*")
    .eq("provider", provider)
    .eq("external_id", externalId)
    .single();

  if (selectError) throw selectError;
  return toPlace(existing);
}

export async function getAllPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toPlace);
}

export async function getPlaceById(id: string): Promise<Place> {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return toPlace(data);
}

// ─────────────────────────────────────────
// TripPlace 조작 (trip_places JOIN places)
// ─────────────────────────────────────────

export async function getTripPlacesByTripId(
  tripId: string,
): Promise<TripPlace[]> {
  const { data, error } = await supabase
    .from("trip_places")
    .select(TRIP_PLACE_SELECT)
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) =>
    toTripPlace(row as Parameters<typeof toTripPlace>[0]),
  );
}

export async function getAllTripPlaces(): Promise<TripPlace[]> {
  const { data, error } = await supabase
    .from("trip_places")
    .select(TRIP_PLACE_SELECT)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) =>
    toTripPlace(row as Parameters<typeof toTripPlace>[0]),
  );
}

export async function getTripPlaceById(id: string): Promise<TripPlace> {
  const { data, error } = await supabase
    .from("trip_places")
    .select(TRIP_PLACE_SELECT)
    .eq("id", id)
    .single();

  if (error) throw error;
  return toTripPlace(data as Parameters<typeof toTripPlace>[0]);
}

export async function createTripPlace(params: {
  tripId: string;
  placeId: string;
  status?: PlaceStatus;
  memo?: string;
  category?: PlaceCategoryType;
  tags?: string[];
}): Promise<TripPlace> {
  const { data: inserted, error } = await supabase
    .from("trip_places")
    .upsert(
      {
        trip_id: params.tripId,
        place_id: params.placeId,
        status: params.status ?? "wished",
        memo: params.memo || null,
        category: params.category || null,
        tags: params.tags ?? [],
      },
      { onConflict: "trip_id,place_id", ignoreDuplicates: true },
    )
    .select(TRIP_PLACE_SELECT);

  if (error) throw error;
  if (inserted && inserted.length > 0) {
    return toTripPlace(inserted[0] as Parameters<typeof toTripPlace>[0]);
  }

  const { data: existing, error: selectError } = await supabase
    .from("trip_places")
    .select(TRIP_PLACE_SELECT)
    .eq("trip_id", params.tripId)
    .eq("place_id", params.placeId)
    .single();

  if (selectError) throw selectError;
  return toTripPlace(existing as Parameters<typeof toTripPlace>[0]);
}

export async function updateTripPlace(
  id: string,
  data: TripPlacePatchInput,
): Promise<TripPlace | undefined> {
  const patch = toTripPlacePatch(data);

  const { data: row, error } = await supabase
    .from("trip_places")
    .update(patch as UpdateDataType<"trip_places">)
    .eq("id", id)
    .select(TRIP_PLACE_SELECT)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined;
    throw error;
  }
  return row
    ? toTripPlace(row as Parameters<typeof toTripPlace>[0])
    : undefined;
}

export async function deleteTripPlace(id: string): Promise<boolean> {
  const { error } = await supabase.from("trip_places").delete().eq("id", id);

  if (error) throw error;
  return true;
}

export async function deleteTripPlacesByTripId(tripId: string): Promise<void> {
  const { error } = await supabase
    .from("trip_places")
    .delete()
    .eq("trip_id", tripId);

  if (error) throw error;
}
