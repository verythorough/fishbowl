import type { Word } from '../types';
import { shuffle } from './shuffle';

/**
 * Load a built-in word list from public/wordlists/
 */
export async function loadBuiltInList(filename: string): Promise<Word[]> {
  try {
    const response = await fetch(`/wordlists/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    const text = await response.text();
    return parseWordList(text, filename);
  } catch (error) {
    console.error(`Failed to load word list: ${filename}`, error);
    return [];
  }
}

/**
 * Parse a word list from text (one word per line, # for comments)
 */
export function parseWordList(text: string, source: string): Word[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))
    .map((word, index) => ({
      id: `${source}-${index}-${Date.now()}`,
      text: word,
      source,
    }));
}

/**
 * Parse a word list from an uploaded file
 */
export function parseTextFile(file: File): Promise<Word[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(parseWordList(text, file.name));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Parse words from pasted text (one word per line)
 */
export function parseTextInput(text: string): Word[] {
  return parseWordList(text, 'custom-input');
}

/**
 * Strip explanatory text an LLM may add before/after the word list.
 * Trims lines from the start and end that look like sentences (more than 5 words).
 */
export function cleanAIResponse(text: string): string {
  const lines = text.split('\n');

  const looksLikeWordEntry = (line: string): boolean => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;
    return trimmed.split(/\s+/).length <= 5;
  };

  const firstIndex = lines.findIndex(looksLikeWordEntry);
  let lastIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (looksLikeWordEntry(lines[i]!)) {
      lastIndex = i;
      break;
    }
  }

  if (firstIndex === -1 || lastIndex === -1) return text;
  return lines.slice(firstIndex, lastIndex + 1).join('\n');
}

/**
 * Randomly select a subset of words from a larger list
 */
export function selectRandomSubset(words: Word[], count: number): Word[] {
  if (words.length <= count) {
    return words;
  }
  const shuffled = shuffle([...words]);
  return shuffled.slice(0, count);
}
