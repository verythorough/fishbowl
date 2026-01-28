import type { GameState, GameConfig, Word, Round, TurnState, TurnStats, RoundStats } from '../types';
import { ROUND_DEFINITIONS, DEFAULT_CONFIG } from '../constants';
import { shuffle } from '../utils/shuffle';
import { saveGameState, loadGameState, clearGameState } from './storage';

export class GameStateManager {
  private state: GameState;
  private listeners: Set<(state: GameState) => void>;
  private saveTimeout: number | null = null;

  constructor() {
    this.state = this.getInitialState();
    this.listeners = new Set();

    // Try to load saved game
    const savedState = loadGameState();
    if (savedState) {
      this.state = savedState;
    }
  }

  private getInitialState(): GameState {
    return {
      config: { ...DEFAULT_CONFIG },
      allWords: [],
      currentRound: 1,
      rounds: [],
      turn: this.getInitialTurnState(),
      remainingWords: [],
      guessedWords: [],
      roundHistory: [],
      gameStarted: false,
      gameCompleted: false,
      lastSaved: 0,
    };
  }

  private getInitialTurnState(): TurnState {
    return {
      wordsGuessedThisTurn: 0,
      wordsSkippedThisTurn: 0,
      timeRemaining: 0,
      isActive: false,
      isPaused: false,
      currentWordIndex: 0,
      turnNumber: 1,
    };
  }

  // Get current state (read-only)
  getState(): Readonly<GameState> {
    return this.state;
  }

  // Subscribe to state changes
  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Update state and notify listeners
  private setState(updater: (state: GameState) => GameState): void {
    this.state = updater(this.state);
    this.notifyListeners();
    this.debouncedSave();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Debounced save to localStorage (max once per second)
  private debouncedSave(): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = window.setTimeout(() => {
      this.saveToStorage();
      this.saveTimeout = null;
    }, 1000);
  }

  // Public API methods

  /**
   * Start a new game with the given configuration and words
   */
  startNewGame(config: GameConfig, words: Word[]): void {
    // Create rounds based on enabled rounds
    const rounds: Round[] = config.enabledRounds.map((type, index) => ({
      ...ROUND_DEFINITIONS[type],
      number: index + 1,
      completed: false,
    }));

    this.setState(() => ({
      config,
      allWords: words,
      currentRound: 1,
      rounds,
      turn: {
        ...this.getInitialTurnState(),
        timeRemaining: config.turnDuration,
      },
      remainingWords: shuffle(words),
      guessedWords: [],
      roundHistory: [],
      gameStarted: true,
      gameCompleted: false,
      lastSaved: Date.now(),
    }));
  }

  /**
   * Start a new turn (reset turn state, keep timer at full duration)
   */
  startTurn(): void {
    this.setState(state => ({
      ...state,
      remainingWords: shuffle(state.remainingWords), // Shuffle words between turns to prevent pattern recognition
      turn: {
        wordsGuessedThisTurn: 0,
        wordsSkippedThisTurn: 0,
        timeRemaining: state.config.turnDuration,
        isActive: true,
        isPaused: false,
        currentWordIndex: 0,
        turnNumber: state.turn.turnNumber,
      },
    }));
  }

  /**
   * Mark the current word as correctly guessed
   */
  markWordCorrect(): void {
    this.setState(state => {
      const currentWord = state.remainingWords[state.turn.currentWordIndex];
      if (!currentWord) return state;

      const newRemaining = state.remainingWords.filter((_, i) => i !== state.turn.currentWordIndex);
      const newGuessed = [...state.guessedWords, currentWord];

      return {
        ...state,
        remainingWords: newRemaining,
        guessedWords: newGuessed,
        turn: {
          ...state.turn,
          wordsGuessedThisTurn: state.turn.wordsGuessedThisTurn + 1,
          currentWordIndex: Math.min(state.turn.currentWordIndex, newRemaining.length - 1),
        },
      };
    });

    // Check if round is complete
    if (this.state.remainingWords.length === 0) {
      // End the current turn first to record its stats
      this.endTurn();
      this.completeRound();
    }
  }

  /**
   * Skip the current word (shuffle it back into the deck)
   */
  skipWord(): void {
    this.setState(state => {
      const currentWord = state.remainingWords[state.turn.currentWordIndex];
      if (!currentWord) return state;

      // Remove current word from its position
      const newRemaining = [...state.remainingWords];
      newRemaining.splice(state.turn.currentWordIndex, 1);

      // Shuffle it back into a random position (not at the end!)
      const randomIndex = Math.floor(Math.random() * (newRemaining.length + 1));
      newRemaining.splice(randomIndex, 0, currentWord);

      return {
        ...state,
        remainingWords: newRemaining,
        turn: {
          ...state.turn,
          wordsSkippedThisTurn: state.turn.wordsSkippedThisTurn + 1,
          // Stay at same index (will show next word in deck)
        },
      };
    });
  }

  /**
   * Update timer (called every second by Timer component)
   */
  updateTimer(timeRemaining: number): void {
    this.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        timeRemaining,
      },
    }));
  }

  /**
   * Pause the current turn
   */
  pauseTurn(): void {
    this.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        isPaused: true,
        isActive: false,
      },
    }));
  }

  /**
   * Resume the current turn
   */
  resumeTurn(): void {
    this.setState(state => ({
      ...state,
      turn: {
        ...state.turn,
        isPaused: false,
        isActive: true,
      },
    }));
  }

  /**
   * End the current turn (timer expired or manual end)
   */
  endTurn(): void {
    const turnStats: TurnStats = {
      turnNumber: this.state.turn.turnNumber,
      wordsGuessed: this.state.turn.wordsGuessedThisTurn,
      wordsSkipped: this.state.turn.wordsSkippedThisTurn,
      duration: this.state.config.turnDuration - this.state.turn.timeRemaining,
    };

    this.setState(state => {
      const lastRoundHistory = state.roundHistory[state.roundHistory.length - 1];
      const isNewRound = !lastRoundHistory || lastRoundHistory.roundNumber !== state.currentRound;

      // If this is a new round, create a new round history entry
      // Otherwise, update the existing entry for this round
      return {
        ...state,
        turn: {
          ...state.turn,
          isActive: false,
          isPaused: false,
          turnNumber: state.turn.turnNumber + 1,
        },
        roundHistory: isNewRound
          ? [
              ...state.roundHistory,
              {
                roundNumber: state.currentRound,
                totalWords: state.allWords.length,
                wordsGuessed: 0,
                totalTurns: 0,
                turnHistory: [turnStats],
              },
            ]
          : [
              ...state.roundHistory.slice(0, -1),
              {
                ...lastRoundHistory,
                turnHistory: [...lastRoundHistory.turnHistory, turnStats],
              },
            ],
      };
    });
  }

  /**
   * Complete the current round (all words guessed)
   */
  completeRound(): void {
    this.setState(state => {
      const currentRoundData = state.rounds[state.currentRound - 1];
      if (!currentRoundData) return state;

      // Get turn history from the current round's history entry
      const currentRoundHistory = state.roundHistory[state.roundHistory.length - 1];
      const turnHistory = currentRoundHistory?.turnHistory || [];

      // Calculate round stats - use allWords.length since all words should be guessed
      const roundStats: RoundStats = {
        roundNumber: state.currentRound,
        totalWords: state.allWords.length,
        wordsGuessed: state.allWords.length, // All words were guessed to complete the round
        totalTurns: turnHistory.length,
        turnHistory,
      };

      // Check if this was the last round
      const isLastRound = state.currentRound === state.config.enabledRounds.length;

      return {
        ...state,
        rounds: state.rounds.map((r, i) =>
          i === state.currentRound - 1 ? { ...r, completed: true } : r
        ),
        // Update the last round history entry with finalized stats
        roundHistory: [
          ...state.roundHistory.slice(0, -1),
          roundStats,
        ],
        currentRound: isLastRound ? state.currentRound : state.currentRound + 1,
        gameCompleted: isLastRound,
        // Reset for next round (all words back in play, shuffled)
        remainingWords: isLastRound ? [] : shuffle(state.allWords),
        guessedWords: [],
        turn: {
          ...this.getInitialTurnState(),
          timeRemaining: state.config.turnDuration,
          turnNumber: 1,
        },
      };
    });
  }

  /**
   * Reset the game (clear everything)
   */
  resetGame(): void {
    clearGameState();
    this.setState(() => this.getInitialState());
  }

  // Storage methods
  private saveToStorage(): void {
    if (this.state.gameStarted) {
      saveGameState(this.state);
    }
  }

  hasSavedGame(): boolean {
    return loadGameState() !== null;
  }
}

// Export singleton instance
let gameStateInstance: GameStateManager | null = null;

export function getGameState(): GameStateManager {
  if (!gameStateInstance) {
    gameStateInstance = new GameStateManager();
  }
  return gameStateInstance;
}
