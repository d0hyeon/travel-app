import type { Airport } from "./airport.types";

const NOISE_PATTERN = /국제|공항|\s/g;

function normalize(value: string) {
  return value.toLowerCase().replace(NOISE_PATTERN, "");
}

function toSearchText(airport: Airport) {
  return [
    airport.code,
    airport.nameKo,
    airport.nameEn,
    airport.cityKo,
    ...(airport.aliases ?? []),
  ]
    .map(normalize)
    .join(" ");
}

export function searchAirports(
  airports: readonly Airport[],
  keyword: string,
): Airport[] {
  const normalized = normalize(keyword);
  if (normalized === "") return [...airports];

  return airports.filter((airport) =>
    toSearchText(airport).includes(normalized),
  );
}
