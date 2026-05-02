import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';
import { shuffle } from '../utils/shuffle';
import type { Word, GameConfig } from '../types';

export class PlayerWordSelectionScreen extends BaseScreen {
  private playerCount: number = 4;
  private currentPlayerIndex: number = 0;
  private wordSubsets: Word[][] = [];
  private activeWords: Word[] = [];
  private inactiveWords: Word[] = [];
  private allFinalWords: Word[] = [];
  private targetPerPlayer: number = 0;
  private config: GameConfig | null = null;
  private allPoolWords: Word[] = [];

  render(): HTMLElement {
    const configJson = sessionStorage.getItem('game-config');
    if (!configJson) {
      getScreenManager().navigate('setup');
      return this.container;
    }
    this.config = JSON.parse(configJson) as GameConfig;

    const poolJson = sessionStorage.getItem('game-words-pool');
    const directJson = sessionStorage.getItem('game-words');

    if (poolJson) {
      this.allPoolWords = JSON.parse(poolJson) as Word[];
    } else if (directJson) {
      this.allPoolWords = JSON.parse(directJson) as Word[];
    } else {
      getScreenManager().navigate('setup');
      return this.container;
    }

    this.showSetup();
    return this.container;
  }

  private clearContainer(): void {
    this.container.innerHTML = '';
  }

  private calculateTargetTotal(playerCount: number): number {
    // Find a value in [40, 50] evenly divisible by playerCount, closest to 45
    let best = -1;
    let bestDist = Infinity;
    for (let t = 40; t <= 50; t++) {
      if (t % playerCount === 0) {
        const dist = Math.abs(t - 45);
        if (dist < bestDist) {
          bestDist = dist;
          best = t;
        }
      }
    }
    if (best === -1) {
      // No exact divisor in [40,50]; round 45 to nearest multiple of playerCount
      const approx = Math.round(45 / playerCount) * playerCount;
      best = Math.max(40, Math.min(50, approx));
    }
    // Can't keep more words than we have
    return Math.min(best, this.allPoolWords.length);
  }

  private initSubsets(): void {
    const totalWords = this.allPoolWords.length;
    const targetTotal = this.calculateTargetTotal(this.playerCount);
    this.targetPerPlayer = Math.floor(targetTotal / this.playerCount);

    const shuffled = shuffle(this.allPoolWords);
    this.wordSubsets = [];

    const baseSize = Math.floor(totalWords / this.playerCount);
    const extras = totalWords % this.playerCount;

    let idx = 0;
    for (let i = 0; i < this.playerCount; i++) {
      const size = i < extras ? baseSize + 1 : baseSize;
      this.wordSubsets.push(shuffled.slice(idx, idx + size));
      idx += size;
    }
  }

  private showSetup(): void {
    this.clearContainer();

    const totalWords = this.allPoolWords.length;

    const header = this.createHeader('Player Word Selection');
    const description = this.createParagraph(
      `The ${totalWords} words will be split evenly. Each player privately keeps the words they want and removes the rest.`
    );

    const countSection = document.createElement('div');
    countSection.style.margin = 'var(--spacing-md) 0';
    countSection.style.padding = 'var(--spacing-md)';
    countSection.style.background = 'var(--color-bg)';
    countSection.style.borderRadius = 'var(--border-radius)';
    countSection.style.border = '2px solid var(--color-border)';

    const countLabel = document.createElement('div');
    countLabel.textContent = 'Number of players';
    countLabel.style.fontWeight = '600';
    countLabel.style.marginBottom = 'var(--spacing-sm)';
    countSection.appendChild(countLabel);

    const countControls = document.createElement('div');
    countControls.style.display = 'flex';
    countControls.style.alignItems = 'center';
    countControls.style.gap = 'var(--spacing-sm)';

    const decrementBtn = this.createButton('−', () => {
      if (this.playerCount > 2) {
        this.playerCount--;
        updatePreview();
      }
    }, 'btn btn-secondary');
    decrementBtn.style.width = '52px';
    decrementBtn.style.minWidth = '52px';
    decrementBtn.style.height = '52px';
    decrementBtn.style.padding = '0';
    decrementBtn.style.display = 'inline-flex';
    decrementBtn.style.alignItems = 'center';
    decrementBtn.style.justifyContent = 'center';
    decrementBtn.style.lineHeight = '1';
    decrementBtn.style.fontSize = 'var(--font-size-xl)';

    const countDisplay = document.createElement('span');
    countDisplay.style.fontSize = 'var(--font-size-2xl)';
    countDisplay.style.fontWeight = '700';
    countDisplay.style.minWidth = '52px';
    countDisplay.style.textAlign = 'center';
    countDisplay.style.flex = '1';

    const incrementBtn = this.createButton('+', () => {
      if (this.playerCount < 10) {
        this.playerCount++;
        updatePreview();
      }
    }, 'btn btn-secondary');
    incrementBtn.style.width = '52px';
    incrementBtn.style.minWidth = '52px';
    incrementBtn.style.height = '52px';
    incrementBtn.style.padding = '0';
    incrementBtn.style.display = 'inline-flex';
    incrementBtn.style.alignItems = 'center';
    incrementBtn.style.justifyContent = 'center';
    incrementBtn.style.lineHeight = '1';
    incrementBtn.style.fontSize = 'var(--font-size-xl)';

    countControls.appendChild(decrementBtn);
    countControls.appendChild(countDisplay);
    countControls.appendChild(incrementBtn);
    countSection.appendChild(countControls);

    const previewEl = document.createElement('div');
    previewEl.style.marginTop = 'var(--spacing-sm)';
    previewEl.style.fontSize = 'var(--font-size-sm)';
    previewEl.style.color = 'var(--color-text-secondary)';
    previewEl.style.textAlign = 'center';
    countSection.appendChild(previewEl);

    const updatePreview = () => {
      countDisplay.textContent = String(this.playerCount);
      const targetTotal = this.calculateTargetTotal(this.playerCount);
      const perPlayer = Math.floor(targetTotal / this.playerCount);
      const subsetSize = Math.ceil(totalWords / this.playerCount);
      const toRemove = Math.max(0, subsetSize - perPlayer);
      if (toRemove === 0) {
        previewEl.textContent = `~${subsetSize} words each — keep all (or add your own!)`;
      } else {
        previewEl.textContent = `~${subsetSize} words each → must keep ${perPlayer} (remove ${toRemove})`;
      }
    };
    updatePreview();

    const beginBtn = this.createButton('Begin →', () => {
      this.initSubsets();
      this.currentPlayerIndex = 0;
      this.allFinalWords = [];
      this.showHandoff();
    }, 'btn btn-primary');
    beginBtn.style.width = '100%';
    beginBtn.style.fontSize = 'var(--font-size-lg)';
    beginBtn.style.marginBottom = 'var(--spacing-sm)';

    const backBtn = this.createButton('← Back', () => {
      getScreenManager().navigate('refine');
    }, 'btn btn-secondary');
    backBtn.style.width = '100%';

    this.container.appendChild(header);
    this.container.appendChild(description);
    this.container.appendChild(countSection);
    this.container.appendChild(beginBtn);
    this.container.appendChild(backBtn);
  }

  private showHandoff(): void {
    this.clearContainer();
    this.container.style.textAlign = 'center';

    const playerNumber = this.currentPlayerIndex + 1;

    const progressEl = document.createElement('div');
    progressEl.className = 'progress';
    progressEl.textContent = `Player ${playerNumber} of ${this.playerCount}`;
    progressEl.style.fontSize = 'var(--font-size-base)';
    progressEl.style.marginBottom = 'var(--spacing-lg)';

    const emoji = document.createElement('div');
    emoji.textContent = '📱';
    emoji.style.fontSize = '4rem';
    emoji.style.lineHeight = '1';
    emoji.style.marginBottom = 'var(--spacing-md)';

    const header = this.createHeader(`Pass to Player ${playerNumber}`);

    const subtext = this.createParagraph(
      `Hand the phone to Player ${playerNumber}. Tap when ready.`
    );

    const tip = this.createParagraph('(Cover the screen while passing!)');
    tip.style.fontSize = 'var(--font-size-sm)';
    tip.style.fontStyle = 'italic';

    const readyBtn = this.createButton(
      `I'm Player ${playerNumber} — Ready!`,
      () => {
        this.container.style.textAlign = '';
        const subset = this.wordSubsets[this.currentPlayerIndex] ?? [];
        this.activeWords = [...subset];
        this.inactiveWords = [];
        this.showSelection();
      },
      'btn btn-primary'
    );
    readyBtn.style.width = '100%';
    readyBtn.style.marginTop = 'var(--spacing-lg)';
    readyBtn.style.fontSize = 'var(--font-size-lg)';

    this.container.appendChild(progressEl);
    this.container.appendChild(emoji);
    this.container.appendChild(header);
    this.container.appendChild(subtext);
    this.container.appendChild(tip);
    this.container.appendChild(readyBtn);
  }

  private showSelection(): void {
    this.clearContainer();

    const playerNumber = this.currentPlayerIndex + 1;
    const toRemove = Math.max(0, this.activeWords.length - this.targetPerPlayer);

    const progressEl = document.createElement('div');
    progressEl.className = 'progress';
    progressEl.textContent = `Player ${playerNumber} of ${this.playerCount}`;

    const header = this.createHeader('Your Words');

    const instructions = this.createParagraph(
      toRemove > 0
        ? `Uncheck ${toRemove} word${toRemove !== 1 ? 's' : ''} to remove ${toRemove !== 1 ? 'them' : 'it'}. You can also swap in your own.`
        : 'Keep all your words, or uncheck some and add your own substitutes.'
    );

    const statusEl = document.createElement('div');
    statusEl.id = 'word-count-status';
    statusEl.style.padding = 'var(--spacing-sm)';
    statusEl.style.borderRadius = 'var(--border-radius)';
    statusEl.style.marginBottom = 'var(--spacing-sm)';
    statusEl.style.textAlign = 'center';
    statusEl.style.fontWeight = '600';
    statusEl.style.fontSize = 'var(--font-size-sm)';

    const listsEl = document.createElement('div');
    listsEl.id = 'word-lists';

    // Add your own word section
    const addSection = document.createElement('div');
    addSection.style.margin = 'var(--spacing-sm) 0';

    const addLabel = document.createElement('div');
    addLabel.textContent = '+ Add your own word';
    addLabel.style.fontWeight = '600';
    addLabel.style.fontSize = 'var(--font-size-sm)';
    addLabel.style.marginBottom = 'var(--spacing-xs)';
    addSection.appendChild(addLabel);

    const addRow = document.createElement('div');
    addRow.style.display = 'flex';
    addRow.style.gap = 'var(--spacing-xs)';

    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.placeholder = 'Type a word or phrase…';
    addInput.style.flex = '1';

    const addBtn = this.createButton('Add', () => {
      const text = addInput.value.trim();
      if (!text) return;
      const newWord: Word = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        source: 'custom',
      };
      this.activeWords = [...this.activeWords, newWord];
      addInput.value = '';
      this.refreshSelectionView();
    }, 'btn btn-secondary');
    addBtn.style.minWidth = '64px';

    addInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') addBtn.click();
    });

    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);
    addSection.appendChild(addRow);

    const doneBtn = this.createButton('Done →', () => this.handleDone(), 'btn btn-success');
    doneBtn.id = 'done-btn';
    doneBtn.style.width = '100%';
    doneBtn.style.marginTop = 'var(--spacing-md)';

    this.container.appendChild(progressEl);
    this.container.appendChild(header);
    this.container.appendChild(instructions);
    this.container.appendChild(statusEl);
    this.container.appendChild(listsEl);
    this.container.appendChild(addSection);
    this.container.appendChild(doneBtn);

    this.refreshSelectionView();
  }

  private refreshSelectionView(): void {
    const currentCount = this.activeWords.length;
    const diff = currentCount - this.targetPerPlayer;

    const statusEl = this.container.querySelector('#word-count-status') as HTMLElement | null;
    if (statusEl) {
      if (diff === 0) {
        statusEl.textContent = `✓ ${currentCount} of ${this.targetPerPlayer} — ready to pass!`;
        statusEl.style.background = '#d1fae5';
        statusEl.style.color = '#065f46';
      } else if (diff > 0) {
        statusEl.textContent = `${currentCount} words — uncheck ${diff} more to continue`;
        statusEl.style.background = '#fee2e2';
        statusEl.style.color = '#991b1b';
      } else {
        statusEl.textContent = `${currentCount} words — need ${-diff} more to continue`;
        statusEl.style.background = '#fee2e2';
        statusEl.style.color = '#991b1b';
      }
    }

    const doneBtn = this.container.querySelector('#done-btn') as HTMLButtonElement | null;
    if (doneBtn) {
      doneBtn.disabled = diff !== 0;
    }

    const listsEl = this.container.querySelector('#word-lists') as HTMLElement | null;
    if (!listsEl) return;
    listsEl.innerHTML = '';

    // Active words panel
    const activePanel = document.createElement('div');
    activePanel.style.border = '2px solid var(--color-border)';
    activePanel.style.borderRadius = 'var(--border-radius)';
    activePanel.style.overflow = 'hidden';
    activePanel.style.marginBottom = 'var(--spacing-sm)';

    const activeHeader = document.createElement('div');
    activeHeader.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    activeHeader.style.background = 'var(--color-primary)';
    activeHeader.style.color = 'white';
    activeHeader.style.fontWeight = '600';
    activeHeader.style.fontSize = 'var(--font-size-sm)';
    activeHeader.textContent = `Keeping (${this.activeWords.length})`;
    activePanel.appendChild(activeHeader);

    if (this.activeWords.length === 0) {
      const empty = document.createElement('div');
      empty.style.padding = 'var(--spacing-sm)';
      empty.style.color = 'var(--color-text-secondary)';
      empty.style.fontSize = 'var(--font-size-sm)';
      empty.textContent = 'No words kept — add some below!';
      activePanel.appendChild(empty);
    } else {
      this.activeWords.forEach(word => {
        activePanel.appendChild(this.createWordRow(word, true));
      });
    }

    listsEl.appendChild(activePanel);

    // Inactive words panel
    if (this.inactiveWords.length > 0) {
      const inactivePanel = document.createElement('div');
      inactivePanel.style.border = '2px solid var(--color-border)';
      inactivePanel.style.borderRadius = 'var(--border-radius)';
      inactivePanel.style.overflow = 'hidden';

      const inactiveHeader = document.createElement('div');
      inactiveHeader.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
      inactiveHeader.style.background = 'var(--color-bg)';
      inactiveHeader.style.borderBottom = '1px solid var(--color-border)';
      inactiveHeader.style.fontWeight = '600';
      inactiveHeader.style.fontSize = 'var(--font-size-sm)';
      inactiveHeader.style.color = 'var(--color-text-secondary)';
      inactiveHeader.textContent = `Removed (${this.inactiveWords.length})`;
      inactivePanel.appendChild(inactiveHeader);

      this.inactiveWords.forEach(word => {
        inactivePanel.appendChild(this.createWordRow(word, false));
      });

      listsEl.appendChild(inactivePanel);
    }
  }

  private createWordRow(word: Word, isActive: boolean): HTMLElement {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    label.style.borderBottom = '1px solid var(--color-border)';
    label.style.gap = 'var(--spacing-sm)';
    label.style.cursor = 'pointer';
    label.style.minHeight = '44px';
    if (!isActive) {
      label.style.opacity = '0.6';
      label.style.background = 'var(--color-bg)';
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isActive;
    checkbox.style.width = '20px';
    checkbox.style.height = '20px';
    checkbox.style.cursor = 'pointer';
    checkbox.style.flexShrink = '0';

    checkbox.addEventListener('change', () => {
      if (isActive) {
        this.activeWords = this.activeWords.filter(w => w.id !== word.id);
        this.inactiveWords = [word, ...this.inactiveWords];
      } else {
        this.inactiveWords = this.inactiveWords.filter(w => w.id !== word.id);
        this.activeWords = [...this.activeWords, word];
      }
      this.refreshSelectionView();
    });

    const textSpan = document.createElement('span');
    textSpan.style.flex = '1';
    textSpan.style.fontSize = 'var(--font-size-base)';
    textSpan.textContent = word.text;

    if (word.source === 'custom') {
      const tag = document.createElement('span');
      tag.textContent = ' ✦ yours';
      tag.style.fontSize = 'var(--font-size-sm)';
      tag.style.color = 'var(--color-primary)';
      textSpan.appendChild(tag);
    }

    label.appendChild(checkbox);
    label.appendChild(textSpan);
    return label;
  }

  private handleDone(): void {
    this.allFinalWords.push(...this.activeWords);
    this.currentPlayerIndex++;

    if (this.currentPlayerIndex >= this.playerCount) {
      this.handleFinish();
    } else {
      this.showHandoff();
    }
  }

  private handleFinish(): void {
    if (!this.config) {
      getScreenManager().navigate('setup');
      return;
    }

    const finalWords = shuffle(this.allFinalWords);
    getGameState().startNewGame(this.config, finalWords);

    sessionStorage.removeItem('game-config');
    sessionStorage.removeItem('game-words');
    sessionStorage.removeItem('game-words-pool');
    sessionStorage.removeItem('game-words-selected');
    sessionStorage.removeItem('game-words-target');

    getScreenManager().navigate('round-intro');
  }
}
