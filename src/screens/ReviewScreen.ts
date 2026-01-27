import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';
import type { Word, GameConfig } from '../types';

export class ReviewScreen extends BaseScreen {
  private wordPool: Word[] = [];
  private selectedWordIds: Set<string> = new Set();
  private targetCount: number = 0;
  private config: GameConfig | null = null;
  private isPoolMode: boolean = false;

  render(): HTMLElement {
    // Load from sessionStorage
    const configJson = sessionStorage.getItem('game-config');
    if (!configJson) {
      getScreenManager().navigate('setup');
      return this.container;
    }
    this.config = JSON.parse(configJson);

    // Check if we're in pool mode (built-in lists with selection) or direct mode (paste/upload)
    const poolJson = sessionStorage.getItem('game-words-pool');
    const selectedJson = sessionStorage.getItem('game-words-selected');
    const targetJson = sessionStorage.getItem('game-words-target');
    const directJson = sessionStorage.getItem('game-words');

    if (poolJson && selectedJson && targetJson) {
      // Pool mode: show selected + available words
      this.isPoolMode = true;
      this.wordPool = JSON.parse(poolJson);
      const selectedIds: string[] = JSON.parse(selectedJson);
      this.selectedWordIds = new Set(selectedIds);
      this.targetCount = parseInt(targetJson, 10);
    } else if (directJson) {
      // Direct mode: all words are selected
      this.isPoolMode = false;
      this.wordPool = JSON.parse(directJson);
      this.selectedWordIds = new Set(this.wordPool.map(w => w.id));
      this.targetCount = this.wordPool.length;
    } else {
      // Something went wrong, go back
      getScreenManager().navigate('setup');
      return this.container;
    }

    const header = this.createHeader('Review Your Words');

    const summary = document.createElement('div');
    summary.className = 'summary mb-md';
    this.updateSummary(summary);

    // Button to toggle word list visibility
    const toggleButton = this.createButton(
      'Review/Edit List',
      () => this.toggleWordList(),
      'btn btn-secondary'
    );
    toggleButton.className = 'btn btn-secondary mb-md';
    toggleButton.style.width = '100%';
    toggleButton.id = 'toggle-word-list';

    // Word list container (initially hidden)
    const wordListWrapper = document.createElement('div');
    wordListWrapper.className = 'word-list-wrapper mb-lg';
    wordListWrapper.style.display = 'none';
    wordListWrapper.id = 'word-list-wrapper';

    const wordList = this.createWordList();
    wordListWrapper.appendChild(wordList);

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
    this.container.appendChild(toggleButton);
    this.container.appendChild(wordListWrapper);
    this.container.appendChild(buttonGroup);

    return this.container;
  }

  private toggleWordList(): void {
    const wrapper = this.container.querySelector('#word-list-wrapper') as HTMLElement;
    const button = this.container.querySelector('#toggle-word-list') as HTMLButtonElement;

    if (wrapper.style.display === 'none') {
      wrapper.style.display = 'block';
      button.textContent = 'Hide List';
    } else {
      wrapper.style.display = 'none';
      button.textContent = 'Review/Edit List';
    }
  }

  private updateSummary(element: HTMLElement): void {
    const selectedCount = this.selectedWordIds.size;
    if (this.isPoolMode) {
      element.textContent = `${selectedCount} of ${this.wordPool.length} words selected (target: ${this.targetCount}). Tap to add/remove words.`;
    } else {
      element.textContent = `You have ${selectedCount} words. Review them below and remove any you don't want.`;
    }
  }

  private createWordList(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'word-list mb-lg';
    container.style.maxHeight = '400px';
    container.style.overflowY = 'auto';
    container.style.border = '2px solid var(--color-border)';
    container.style.borderRadius = 'var(--border-radius)';
    container.style.padding = 'var(--spacing-sm)';

    if (this.isPoolMode) {
      // Show selected words first, then available words
      const selected = this.wordPool.filter(w => this.selectedWordIds.has(w.id));
      const available = this.wordPool.filter(w => !this.selectedWordIds.has(w.id));

      if (selected.length > 0) {
        const selectedHeader = document.createElement('div');
        selectedHeader.textContent = 'Selected Words';
        selectedHeader.style.fontWeight = '600';
        selectedHeader.style.padding = 'var(--spacing-sm)';
        selectedHeader.style.color = 'var(--color-primary)';
        container.appendChild(selectedHeader);

        selected.forEach(word => {
          container.appendChild(this.createWordItem(word, true));
        });
      }

      if (available.length > 0) {
        const availableHeader = document.createElement('div');
        availableHeader.textContent = 'Available Words';
        availableHeader.style.fontWeight = '600';
        availableHeader.style.padding = 'var(--spacing-sm)';
        availableHeader.style.marginTop = 'var(--spacing-md)';
        availableHeader.style.color = 'var(--color-text-secondary)';
        container.appendChild(availableHeader);

        available.forEach(word => {
          container.appendChild(this.createWordItem(word, false));
        });
      }
    } else {
      // Direct mode: show all words with remove buttons
      this.wordPool.forEach(word => {
        container.appendChild(this.createWordItem(word, true));
      });
    }

    return container;
  }

  private createWordItem(word: Word, isSelected: boolean): HTMLElement {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    item.style.borderBottom = '1px solid var(--color-border)';
    if (!isSelected && this.isPoolMode) {
      item.style.opacity = '0.6';
    }

    const wordText = document.createElement('span');
    wordText.textContent = word.text;

    const button = document.createElement('button');
    if (this.isPoolMode) {
      // Pool mode: toggle selection
      button.textContent = isSelected ? '✓' : '+';
      button.className = isSelected ? 'btn btn-success' : 'btn btn-secondary';
      button.title = isSelected ? 'Remove from selection' : 'Add to selection';
    } else {
      // Direct mode: remove only
      button.textContent = '✕';
      button.className = 'btn btn-secondary';
      button.title = 'Remove this word';
    }
    button.style.padding = 'var(--spacing-xs)';
    button.style.minWidth = '32px';
    button.style.minHeight = '32px';

    button.addEventListener('click', () => {
      if (this.isPoolMode) {
        // Toggle selection
        if (isSelected) {
          this.selectedWordIds.delete(word.id);
        } else {
          this.selectedWordIds.add(word.id);
        }
      } else {
        // Remove from pool entirely
        this.wordPool = this.wordPool.filter(w => w.id !== word.id);
        this.selectedWordIds.delete(word.id);
      }

      // Re-render
      this.refreshWordList();
    });

    item.appendChild(wordText);
    item.appendChild(button);

    return item;
  }

  private refreshWordList(): void {
    const wrapper = this.container.querySelector('#word-list-wrapper') as HTMLElement;
    const summary = this.container.querySelector('.summary') as HTMLElement;

    wrapper.innerHTML = '';

    const wordList = document.createElement('div');
    wordList.className = 'word-list';
    wordList.style.maxHeight = '400px';
    wordList.style.overflowY = 'auto';
    wordList.style.border = '2px solid var(--color-border)';
    wordList.style.borderRadius = 'var(--border-radius)';
    wordList.style.padding = 'var(--spacing-sm)';

    if (this.isPoolMode) {
      // Show selected words first, then available words
      const selected = this.wordPool.filter(w => this.selectedWordIds.has(w.id));
      const available = this.wordPool.filter(w => !this.selectedWordIds.has(w.id));

      if (selected.length > 0) {
        const selectedHeader = document.createElement('div');
        selectedHeader.textContent = 'Selected Words';
        selectedHeader.style.fontWeight = '600';
        selectedHeader.style.padding = 'var(--spacing-sm)';
        selectedHeader.style.color = 'var(--color-primary)';
        wordList.appendChild(selectedHeader);

        selected.forEach(word => {
          wordList.appendChild(this.createWordItem(word, true));
        });
      }

      if (available.length > 0) {
        const availableHeader = document.createElement('div');
        availableHeader.textContent = 'Available Words';
        availableHeader.style.fontWeight = '600';
        availableHeader.style.padding = 'var(--spacing-sm)';
        availableHeader.style.marginTop = 'var(--spacing-md)';
        availableHeader.style.color = 'var(--color-text-secondary)';
        wordList.appendChild(availableHeader);

        available.forEach(word => {
          wordList.appendChild(this.createWordItem(word, false));
        });
      }
    } else {
      // Direct mode
      this.wordPool.forEach(word => {
        wordList.appendChild(this.createWordItem(word, true));
      });
    }

    wrapper.appendChild(wordList);

    this.updateSummary(summary);

    // Disable start button if no words selected
    if (this.selectedWordIds.size === 0) {
      const startButton = this.container.querySelector('.btn-success') as HTMLButtonElement;
      if (startButton) {
        startButton.disabled = true;
      }
    } else {
      const startButton = this.container.querySelector('.btn-success') as HTMLButtonElement;
      if (startButton) {
        startButton.disabled = false;
      }
    }
  }

  private handleStart(): void {
    if (this.selectedWordIds.size === 0) {
      alert('You need at least one word to start!');
      return;
    }

    if (!this.config) {
      alert('Configuration error. Please start over.');
      getScreenManager().navigate('setup');
      return;
    }

    // Get the selected words
    const selectedWords = this.wordPool.filter(w => this.selectedWordIds.has(w.id));

    // Initialize the game!
    const gameState = getGameState();
    gameState.startNewGame(this.config, selectedWords);

    // Clear sessionStorage
    sessionStorage.removeItem('game-config');
    sessionStorage.removeItem('game-words');
    sessionStorage.removeItem('game-words-pool');
    sessionStorage.removeItem('game-words-selected');
    sessionStorage.removeItem('game-words-target');

    // Navigate to round intro
    getScreenManager().navigate('round-intro');
  }
}
