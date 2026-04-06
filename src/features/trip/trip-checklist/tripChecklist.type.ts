
export interface TripChecklist {
  id: string;
  tripId: string;
  title: string;
  content?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  isCompleted: boolean;
  memberId?: string;
}

export type MutableTripChecklist = Omit<TripChecklist, 'createdAt' | 'id' | 'tripId'>;