import type { Round, RoundType } from './types';

// Round definitions
export const ROUND_DEFINITIONS: Record<RoundType, Omit<Round, 'number' | 'completed'>> = {
  describe: {
    type: 'describe',
    name: 'Describe It',
    instructions: 'Use any words or gestures. You can say anything except the word itself!',
  },
  'one-word': {
    type: 'one-word',
    name: 'One Word',
    instructions: 'Give only ONE word as a clue. You can repeat it, but no other words!',
  },
  charades: {
    type: 'charades',
    name: 'Charades',
    instructions: 'Act it out! No words allowed. Sound effects are OK!',
  },
  bedsheet: {
    type: 'bedsheet',
    name: 'Under the Bedsheet',
    instructions: 'Act it out under a bedsheet! No words, no sound effects!',
  },
  sounds: {
    type: 'sounds',
    name: 'Sound Effects Only',
    instructions: 'Use only sound effects. No words, no acting!',
  },
};

// Default game configuration
export const DEFAULT_CONFIG = {
  turnDuration: 60, // seconds
  enabledRounds: ['describe', 'one-word', 'charades'] as RoundType[],
  allowSkipping: true,
};

// LocalStorage key
export const STORAGE_KEY = 'triple-take-game-state';

// Storage version for future migrations
export const STORAGE_VERSION = 1;
