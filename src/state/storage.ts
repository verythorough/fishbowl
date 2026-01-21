import type { GameState } from '../types';
import { STORAGE_KEY, STORAGE_VERSION } from '../constants';

interface StorageData {
  version: number;
  state: GameState;
  savedAt: number;
}

export function saveGameState(state: GameState): void {
  try {
    const data: StorageData = {
      version: STORAGE_VERSION,
      state,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function loadGameState(): GameState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;

    const data: StorageData = JSON.parse(json);

    // Validate version and data structure
    if (data.version !== STORAGE_VERSION) {
      console.warn('Saved game version mismatch, clearing saved data');
      clearGameState();
      return null;
    }

    if (!data.state || !data.state.gameStarted) {
      return null;
    }

    return data.state;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

export function hasSavedGame(): boolean {
  return loadGameState() !== null;
}
