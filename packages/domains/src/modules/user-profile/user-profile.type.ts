
export interface UserProfile {
  id: string;
  name: string;
  profileUrl: string | null;
}

export interface UserTrip {
  id: string;
  name: string;
  destinations: string[];
  endDate: string;
}
