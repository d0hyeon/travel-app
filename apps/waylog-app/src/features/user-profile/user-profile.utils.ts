import type { Coordinate } from "@waylog/utility";
import {
  Country,
  getCoordinateByLocation,
  getCountryByLocation,
  getCountryNameByLocation,
  isLocation,
  type Location,
} from "@waylog/domains/modules/location";
import type { UserTrip } from "@waylog/domains/modules/user-profile";

export interface VisitedLocation {
  location: Location;
  countryCode: Country | undefined;
  countryName: string;
  coordinate: Coordinate;
  visitCount: number;
  lastVisitedAt: string;
  trips: UserTrip[];
}

export function deriveVisitedLocations(trips: UserTrip[]): VisitedLocation[] {
  const aggregatedLocations = new Map<Location, VisitedLocation>();

  trips.forEach((trip) => {
    trip.destinations.forEach((destination) => {
      if (!isLocation(destination)) return;

      const existingLocation = aggregatedLocations.get(destination);
      if (existingLocation == null) {
        aggregatedLocations.set(destination, {
          location: destination,
          countryCode: getCountryByLocation(destination),
          countryName: getCountryNameByLocation(destination),
          coordinate: getCoordinateByLocation(destination),
          visitCount: 1,
          lastVisitedAt: trip.endDate,
          trips: [trip],
        });
        return;
      }

      existingLocation.visitCount += 1;
      existingLocation.trips.push(trip);
      if (trip.endDate > existingLocation.lastVisitedAt)
        existingLocation.lastVisitedAt = trip.endDate;
    });
  });

  return [...aggregatedLocations.values()].toSorted(
    (first, second) => second.visitCount - first.visitCount,
  );
}

/** 나라별 방문 여행 수. 한 여행이 여러 나라를 거치면 각 나라에 1씩 센다. */
export function deriveVisitedCountries(trips: UserTrip[]): Map<Country, number> {
  const visitCountByCountry = new Map<Country, number>();

  trips.forEach((trip) => {
    const countriesInTrip = new Set<Country>();
    trip.destinations.forEach((destination) => {
      const country = getCountryByLocation(destination);
      if (country != null) countriesInTrip.add(country);
    });

    countriesInTrip.forEach((country) => {
      visitCountByCountry.set(
        country,
        (visitCountByCountry.get(country) ?? 0) + 1,
      );
    });
  });

  return visitCountByCountry;
}
