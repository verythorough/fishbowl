import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';
import type { Word, GameConfig } from '../types';

export class ReviewScreen extends BaseScreen {
  private wordPool: Word[] = [];
  private selectedWordIds: Set<string> = new Set();
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

    const poolJson = sessionStorage.getItem('game-words-pool');
    const selectedJson = sessionStorage.getItem('game-words-selected');
    const targetJson = sessionStorage.getItem('game-words-target');
    const directJson = sessionStorage.getItem('game-words');

    if (poolJson && selectedJson && targetJson) {
      this.isPoolMode = true;
      this.wordPool = JSON.parse(poolJson);
      const selectedIds: string[] = JSON.parse(selectedJson);
      this.selectedWordIds = new Set(selectedIds);
    } else if (directJson) {
      this.isPoolMode = false;
      this.wordPool = JSON.parse(directJson);
      this.selectedWordIds = new Set(this.wordPool.map(w => w.id));
    } else {
      getScreenManager().navigate('setup');
      return this.container;
    }

    const header = this.createHeader('Ready to play?');

    const summary = document.createElement('p');
    const selectedCount = this.selectedWordIds.size;
    summary.textContent = this.isPoolMode
      ? `${selectedCount} of ${this.wordPool.length} words selected.`
      : `${selectedCount} word${selectedCount !== 1 ? 's' : ''} ready.`;
    summary.style.color = 'var(--color-text-secondary)';

    // Primary Start Game button
    const startButton = this.createButton(
      'Start Game!',
      () => this.handleStart(),
      'btn btn-success'
    );
    startButton.style.width = '100%';
    startButton.style.marginBottom = 'var(--spacing-md)';
    startButton.style.fontSize = 'var(--font-size-xl)';
    startButton.style.padding = 'var(--spacing-md)';
    startButton.disabled = selectedCount === 0;

    // Refine word list button
    const refineButton = this.createButton(
      'Refine word list',
      () => getScreenManager().navigate('refine'),
      'btn btn-primary'
    );
    refineButton.style.width = '100%';
    refineButton.style.marginBottom = 'var(--spacing-sm)';

    const backButton = this.createButton(
      'Go back',
      () => getScreenManager().navigate('word-input'),
      'btn btn-secondary'
    );
    backButton.style.width = '100%';
    backButton.style.fontSize = 'var(--font-size-sm)';

    this.container.appendChild(header);
    this.container.appendChild(summary);
    this.container.appendChild(startButton);
    this.container.appendChild(refineButton);
    this.container.appendChild(backButton);

    return this.container;
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

    const selectedWords = this.wordPool.filter(w => this.selectedWordIds.has(w.id));

    const gameState = getGameState();
    gameState.startNewGame(this.config, selectedWords);

    sessionStorage.removeItem('game-config');
    sessionStorage.removeItem('game-words');
    sessionStorage.removeItem('game-words-pool');
    sessionStorage.removeItem('game-words-selected');
    sessionStorage.removeItem('game-words-target');

    getScreenManager().navigate('round-intro');
  }
}
