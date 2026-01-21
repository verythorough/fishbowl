import type { Word } from '../types';

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
