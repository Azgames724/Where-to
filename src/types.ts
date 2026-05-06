export type TeamId = 'madrid' | 'city' | 'bayern' | 'arsenal' | 'barcelona';

export interface Team {
  id: TeamId;
  name: string;
  color: string;
  logo: string; 
  image: string; // Background visual for the card
  accent: string;
}

export interface Vote {
  teamId: TeamId;
  userId: string;
  votedAt: any; // ServerTimestamp
}
