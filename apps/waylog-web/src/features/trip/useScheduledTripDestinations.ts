import type { Location } from '@waylog/domains/modules/location';
import { isLocation } from '@waylog/domains/modules/location';
import { useScheduledTrips } from './useScheduledTrips';

export function useScheduledTripDestinations(): Location[] {
  const { data: scheduledTrips } = useScheduledTrips();

  const scheduled = scheduledTrips.at(0);
  
  if (!scheduled) return []
  return scheduled.destinations.filter(isLocation)
}

