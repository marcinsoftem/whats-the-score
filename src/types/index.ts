export type PlayerType = 'real' | 'virtual';

export interface Player {
  id: string;
  nickname: string;
  avatarUrl?: string;
  type: PlayerType;
  associatedUserId?: string;
}

export interface Game {
  id: string;
  player1Score: number;
  player2Score: number;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  games: Game[];
  createdAt: string;
  status: 'ongoing' | 'completed';
  winnerId?: string;
}
