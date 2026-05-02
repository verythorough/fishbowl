import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import type { Word } from '../types';

type RefineMode = 'choose' | 'single-reviewer';

export class RefineScreen extends BaseScreen {
  private wordPool: Word[] = [];
  private selectedWordIds: Set<string> = new Set();
  private targetCount: number = 0;
  private isPoolMode: boolean = false;
  private mode: RefineMode = 'choose';

  render(): HTMLElement {
    const configJson = sessionStorage.getItem('game-config');
    if (!configJson) {
      getScreenManager().navigate('setup');
      return this.container;
    }

    const poolJson = sessionStorage.getItem('game-words-pool');
    const selectedJson = sessionStorage.getItem('game-words-selected');
    const targetJson = sessionStorage.getItem('game-words-target');
    const directJson = sessionStorage.getItem('game-words');

    if (poolJson && selectedJson && targetJson) {
      this.isPoolMode = true;
      this.wordPool = JSON.parse(poolJson);
      const selectedIds: string[] = JSON.parse(selectedJson);
      this.selectedWordIds = new Set(selectedIds);
      this.targetCount = parseInt(targetJson, 10);
    } else if (directJson) {
      this.isPoolMode = false;
      this.wordPool = JSON.parse(directJson);
      this.selectedWordIds = new Set(this.wordPool.map(w => w.id));
      this.targetCount = this.wordPool.length;
    } else {
      getScreenManager().navigate('setup');
      return this.container;
    }

    this.renderCurrentMode();
    return this.container;
  }

  private renderCurrentMode(): void {
    this.container.innerHTML = '';
    if (this.mode === 'choose') {
      this.renderChooseView();
    } else {
      this.renderSingleReviewerView();
    }
  }

  private renderChooseView(): void {
    const header = this.createHeader('Refine word list');
    const intro = this.createParagraph(
      'Curate your words before the game begins. Pick how you want to refine the list:'
    );
    intro.style.color = 'var(--color-text-secondary)';

    const optionsWrapper = document.createElement('div');
    optionsWrapper.style.display = 'flex';
    optionsWrapper.style.flexDirection = 'column';
    optionsWrapper.style.gap = 'var(--spacing-md)';
    optionsWrapper.style.margin = 'var(--spacing-lg) 0';

    optionsWrapper.appendChild(
      this.createOptionCard(
        "I'll choose",
        'Review the full list yourself and pick the words you want.',
        () => {
          this.mode = 'single-reviewer';
          this.renderCurrentMode();
        }
      )
    );

    optionsWrapper.appendChild(
      this.createOptionCard(
        'Players choose',
        'Pass the device around so each player picks from a slice of the list.',
        () => getScreenManager().navigate('player-word-selection')
      )
    );

    const backBtn = this.createButton(
      '← Back',
      () => getScreenManager().navigate('review'),
      'btn btn-secondary'
    );
    backBtn.style.width = '100%';

    this.container.appendChild(header);
    this.container.appendChild(intro);
    this.container.appendChild(optionsWrapper);
    this.container.appendChild(backBtn);
  }

  private createOptionCard(title: string, description: string, onClick: () => void): HTMLElement {
    const card = document.createElement('button');
    card.className = 'btn btn-primary';
    card.style.display = 'block';
    card.style.width = '100%';
    card.style.textAlign = 'left';
    card.style.padding = 'var(--spacing-md)';
    card.style.whiteSpace = 'normal';
    card.style.lineHeight = '1.4';
    card.addEventListener('click', onClick);

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.fontSize = 'var(--font-size-lg)';
    titleEl.style.fontWeight = '700';
    titleEl.style.marginBottom = 'var(--spacing-xs)';

    const descEl = document.createElement('div');
    descEl.textContent = description;
    descEl.style.fontSize = 'var(--font-size-sm)';
    descEl.style.opacity = '0.9';

    card.appendChild(titleEl);
    card.appendChild(descEl);
    return card;
  }

  private renderSingleReviewerView(): void {
    const header = this.createHeader('Review word list');

    const description = document.createElement('p');
    description.style.color = 'var(--color-text-secondary)';
    description.style.fontSize = 'var(--font-size-sm)';
    description.id = 'refine-description';
    this.container.appendChild(header);
    this.container.appendChild(description);

    const wordListWrapper = document.createElement('div');
    wordListWrapper.id = 'word-list-wrapper';
    wordListWrapper.className = 'mb-md';
    this.container.appendChild(wordListWrapper);

    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = 'var(--spacing-sm)';

    const backBtn = this.createButton(
      '← Back to options',
      () => {
        this.mode = 'choose';
        this.renderCurrentMode();
      },
      'btn btn-secondary'
    );
    backBtn.style.flex = '1';

    const doneBtn = this.createButton(
      'Done',
      () => {
        this.persistSelection();
        getScreenManager().navigate('review');
      },
      'btn btn-success'
    );
    doneBtn.id = 'refine-done-btn';
    doneBtn.style.flex = '1';

    buttonRow.appendChild(backBtn);
    buttonRow.appendChild(doneBtn);
    this.container.appendChild(buttonRow);

    this.refreshWordList();
  }

  private updateDescriptionAndDoneBtn(): void {
    const description = this.container.querySelector('#refine-description') as HTMLElement | null;
    if (description) {
      const selectedCount = this.selectedWordIds.size;
      if (this.isPoolMode) {
        description.textContent = `${selectedCount} of ${this.wordPool.length} words selected (target: ${this.targetCount}). Tap to add or remove.`;
      } else {
        description.textContent = `You have ${selectedCount} words. Remove any you don't want.`;
      }
    }

    const doneBtn = this.container.querySelector('#refine-done-btn') as HTMLButtonElement | null;
    if (doneBtn) {
      doneBtn.disabled = this.selectedWordIds.size === 0;
    }
  }

  private buildWordList(): HTMLElement {
    const list = document.createElement('div');
    list.className = 'word-list';
    list.style.border = '2px solid var(--color-border)';
    list.style.borderRadius = 'var(--border-radius)';
    list.style.padding = 'var(--spacing-sm)';

    if (this.isPoolMode) {
      const selected = this.wordPool.filter(w => this.selectedWordIds.has(w.id));
      const available = this.wordPool.filter(w => !this.selectedWordIds.has(w.id));

      if (selected.length > 0) {
        const selectedHeader = document.createElement('div');
        selectedHeader.textContent = 'Selected Words';
        selectedHeader.style.fontWeight = '600';
        selectedHeader.style.padding = 'var(--spacing-sm)';
        selectedHeader.style.color = 'var(--color-primary)';
        list.appendChild(selectedHeader);

        selected.forEach(word => {
          list.appendChild(this.createWordItem(word, true));
        });
      }

      if (available.length > 0) {
        const availableHeader = document.createElement('div');
        availableHeader.textContent = 'Available Words';
        availableHeader.style.fontWeight = '600';
        availableHeader.style.padding = 'var(--spacing-sm)';
        availableHeader.style.marginTop = 'var(--spacing-md)';
        availableHeader.style.color = 'var(--color-text-secondary)';
        list.appendChild(availableHeader);

        available.forEach(word => {
          list.appendChild(this.createWordItem(word, false));
        });
      }
    } else {
      this.wordPool.forEach(word => {
        list.appendChild(this.createWordItem(word, true));
      });
    }

    return list;
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
      button.textContent = isSelected ? '✓' : '+';
      button.className = isSelected ? 'btn btn-success' : 'btn btn-secondary';
      button.title = isSelected ? 'Remove from selection' : 'Add to selection';
    } else {
      button.textContent = '✕';
      button.className = 'btn btn-secondary';
      button.title = 'Remove this word';
    }
    button.style.padding = 'var(--spacing-xs)';
    button.style.minWidth = '32px';
    button.style.minHeight = '32px';

    button.addEventListener('click', () => {
      if (this.isPoolMode) {
        if (isSelected) {
          this.selectedWordIds.delete(word.id);
        } else {
          this.selectedWordIds.add(word.id);
        }
      } else {
        this.wordPool = this.wordPool.filter(w => w.id !== word.id);
        this.selectedWordIds.delete(word.id);
      }
      this.refreshWordList();
    });

    item.appendChild(wordText);
    item.appendChild(button);
    return item;
  }

  private refreshWordList(): void {
    const wrapper = this.container.querySelector('#word-list-wrapper') as HTMLElement | null;
    if (!wrapper) return;
    wrapper.innerHTML = '';
    wrapper.appendChild(this.buildWordList());
    this.updateDescriptionAndDoneBtn();
  }

  private persistSelection(): void {
    if (this.isPoolMode) {
      sessionStorage.setItem(
        'game-words-selected',
        JSON.stringify(Array.from(this.selectedWordIds))
      );
    } else {
      sessionStorage.setItem('game-words', JSON.stringify(this.wordPool));
    }
  }
}
