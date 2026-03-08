export interface TripMemo {
  id: string;
  tripId: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export type MutableTripMemo = Pick<TripMemo, 'content' | 'isPinned'>;
