// Core game types
export type RoundType = 'describe' | 'one-word' | 'charades' | 'bedsheet' | 'sounds';

export interface Word {
  id: string;
  text: string;
  source: string;
}

export interface Round {
  number: number;
  type: RoundType;
  name: string;
  instructions: string;
  completed: boolean;
}

export interface TurnState {
  wordsGuessedThisTurn: number;
  wordsSkippedThisTurn: number;
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  currentWordIndex: number;
  turnNumber: number; // Which turn in the current round (1, 2, 3...)
}

export interface TurnStats {
  turnNumber: number;
  wordsGuessed: number;
  wordsSkipped: number;
  duration: number;
}

export interface RoundStats {
  roundNumber: number;
  totalWords: number;
  wordsGuessed: number; // Total across all turns
  totalTurns: number;
  turnHistory: TurnStats[];
}

export interface GameConfig {
  turnDuration: number;
  enabledRounds: RoundType[];
  allowSkipping: boolean;
}

export interface GameState {
  config: GameConfig;
  allWords: Word[];
  currentRound: number;
  rounds: Round[];
  turn: TurnState;
  remainingWords: Word[];
  guessedWords: Word[];
  roundHistory: RoundStats[];
  gameStarted: boolean;
  gameCompleted: boolean;
  lastSaved: number;
}

export type Screen =
  | 'welcome'
  | 'setup'
  | 'word-input'
  | 'review'
  | 'round-intro'
  | 'turn-intro'
  | 'play'
  | 'turn-end'
  | 'round-end'
  | 'game-end';
