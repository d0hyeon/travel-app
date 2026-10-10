import type { Location } from '@waylog/domains/modules/location';
import { isLocation } from '@waylog/domains/modules/location';
import { useScheduledTrips } from './useScheduledTrips';
import { useAuth } from '@waylog/domains/clients';

export function useScheduledTripDestinations(): Location[] {
  const { data: auth } = useAuth({ required: false });
  const isSignedIn = auth != null;

  const { data: scheduledTrips } = useScheduledTrips({ enabled: isSignedIn });

  const scheduled = scheduledTrips?.at(0);
  
  if (!scheduled) return []
  return scheduled.destinations.filter(isLocation)
}

