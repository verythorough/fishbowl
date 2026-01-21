import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';
import type { Word, GameConfig } from '../types';

export class ReviewScreen extends BaseScreen {
  private words: Word[] = [];
  private config: GameConfig | null = null;

  render(): HTMLElement {
    // Load from sessionStorage
    const wordsJson = sessionStorage.getItem('game-words');
    const configJson = sessionStorage.getItem('game-config');

    if (!wordsJson || !configJson) {
      // Something went wrong, go back
      getScreenManager().navigate('setup');
      return this.container;
    }

    this.words = JSON.parse(wordsJson);
    this.config = JSON.parse(configJson);

    const header = this.createHeader('Review Your Words');

    const summary = this.createParagraph(
      `You have ${this.words.length} words. Review them below and remove any you don't want.`
    );
    summary.className = 'mb-md';

    // Word list container
    const wordList = this.createWordList();

    // Buttons
    const startButton = this.createButton(
      'Start Game!',
      () => this.handleStart(),
      'btn btn-success'
    );

    const backButton = this.createButton(
      'Back',
      () => getScreenManager().navigate('word-input'),
      'btn btn-secondary'
    );

    const buttonGroup = this.createButtonGroup([backButton, startButton]);

    this.container.appendChild(header);
    this.container.appendChild(summary);
    this.container.appendChild(wordList);
    this.container.appendChild(buttonGroup);

    return this.container;
  }

  private createWordList(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'word-list mb-lg';
    container.style.maxHeight = '400px';
    container.style.overflowY = 'auto';
    container.style.border = '2px solid var(--color-border)';
    container.style.borderRadius = 'var(--border-radius)';
    container.style.padding = 'var(--spacing-sm)';

    this.words.forEach((word, index) => {
      const wordItem = this.createWordItem(word, index);
      container.appendChild(wordItem);
    });

    return container;
  }

  private createWordItem(word: Word, index: number): HTMLElement {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    item.style.borderBottom = '1px solid var(--color-border)';

    const wordText = document.createElement('span');
    wordText.textContent = word.text;

    const removeButton = document.createElement('button');
    removeButton.textContent = '✕';
    removeButton.className = 'btn btn-secondary';
    removeButton.style.padding = 'var(--spacing-xs)';
    removeButton.style.minWidth = '32px';
    removeButton.style.minHeight = '32px';
    removeButton.title = 'Remove this word';

    removeButton.addEventListener('click', () => {
      this.words.splice(index, 1);
      sessionStorage.setItem('game-words', JSON.stringify(this.words));

      // Re-render the word list
      const wordList = this.container.querySelector('.word-list') as HTMLElement;
      const summary = this.container.querySelector('p') as HTMLElement;

      wordList.innerHTML = '';
      this.words.forEach((w, i) => {
        wordList.appendChild(this.createWordItem(w, i));
      });

      summary.textContent = `You have ${this.words.length} words. Review them below and remove any you don't want.`;

      // If no words left, disable start button
      if (this.words.length === 0) {
        const startButton = this.container.querySelector('.btn-success') as HTMLButtonElement;
        if (startButton) {
          startButton.disabled = true;
        }
      }
    });

    item.appendChild(wordText);
    item.appendChild(removeButton);

    return item;
  }

  private handleStart(): void {
    if (this.words.length === 0) {
      alert('You need at least one word to start!');
      return;
    }

    if (!this.config) {
      alert('Configuration error. Please start over.');
      getScreenManager().navigate('setup');
      return;
    }

    // Initialize the game!
    const gameState = getGameState();
    gameState.startNewGame(this.config, this.words);

    // Clear sessionStorage
    sessionStorage.removeItem('game-config');
    sessionStorage.removeItem('game-words');

    // Navigate to round intro
    getScreenManager().navigate('round-intro');
  }
}
