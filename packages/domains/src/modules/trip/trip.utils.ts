import {
  Country,
  getCoordinateByLocation,
  getCountryByLocation,
  isLocation,
} from "../location";
import { isOverseasByCoordinate } from "../../utils";
import type { Trip } from "./trip.types";

export function isIncludeOverseas(destinations: Trip["destinations"]): boolean {
  return destinations.some((destination) => {
    if (!isLocation(destination)) return false;

    const coordinate = getCoordinateByLocation(destination);
    return isOverseasByCoordinate(coordinate.lat, coordinate.lng);
  });
}

export function countUniqueCountries(trips: Trip[]): number {
  const countries = new Set<Country>();
  trips.forEach((trip) => {
    trip.destinations.forEach((destination) => {
      const country = getCountryByLocation(destination);
      if (country != null) countries.add(country);
    });
  });
  return countries.size;
}

export function countUniqueRegions(trips: Trip[]) {
  const allDestinations = trips.flatMap((trip) => trip.destinations);
  return new Set(allDestinations).size;
}
