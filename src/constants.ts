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

// AI word list generation prompt
export const AI_WORD_LIST_PROMPT = `Generate a word list for a party guessing game called Triple Take. The same words are used across three rounds with increasing difficulty:

Round 1: Describe it using any words (but not the word itself)
Round 2: Give only ONE word as a clue
Round 3: Act it out silently (charades)

Players see every word in Round 1 first, so by Rounds 2-3 they're choosing from a known set — words don't need to be guessable from a single clue or charade alone.

WHAT MAKES A GOOD WORD:
- Well-known to the audience (see below) — guessers need a fair chance
- Concrete enough to describe and act out — a person, character, place, object, or cultural reference works better than a purely abstract concept
- 1-4 word phrases (e.g., "Harry Potter", "Pizza", "The Eiffel Tower")
- A mix of: real people, fictional characters, places, objects, animals, and pop culture
- A range of difficulty — some easy crowd-pleasers, some that will get laughs in charades

ASK HOW TO CUSTOMIZE:
Before generating, ask me about my player group:
- Who's playing? (ages, e.g., "adults" or "family with kids ages 8+")
- Where are they from? (helps pick culturally relevant references)
- Any shared interests or themes? (e.g., "we're all teachers", "80s movie fans", "coworkers at a tech startup")

If not specified, assume a general adult audience with broad pop culture knowledge.

Generate exactly 60 words. Output as a plain text list with one word per line. No numbering, no bullet points, no categories, no explanations — just the words.`;

// LocalStorage key
export const STORAGE_KEY = 'triple-take-game-state';

// Storage version for future migrations
export const STORAGE_VERSION = 1;
