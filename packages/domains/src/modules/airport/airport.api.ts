import { supabase } from "../../gateways/client";
import type { Airport } from "./airport.types";

function toAirport(row: {
  code: string;
  name_ko: string;
  name_en: string;
  city_ko: string;
  timezone: string;
  aliases: string[] | null;
}): Airport {
  return {
    code: row.code,
    nameKo: row.name_ko,
    nameEn: row.name_en,
    cityKo: row.city_ko,
    timezone: row.timezone,
    aliases: row.aliases ?? undefined,
  };
}

export async function getAirports(): Promise<Airport[]> {
  const { data, error } = await supabase.from("airports").select("*");

  if (error) throw error;
  return data.map(toAirport);
}

export async function getAirport(code: string): Promise<Airport | undefined> {
  const { data, error } = await supabase
    .from("airports")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  return data == null ? undefined : toAirport(data);
}
