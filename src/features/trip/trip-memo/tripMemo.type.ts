export interface TripMemo {
  id: string;
  tripId: string;
  title: string | null;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export type MutableTripMemo = Pick<TripMemo, 'title' | 'content' | 'isPinned'>;
