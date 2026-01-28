import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { loadBuiltInList, parseTextInput, parseTextFile, selectRandomSubset } from '../utils/wordLoader';
import type { Word } from '../types';

type Tab = 'builtin' | 'paste' | 'upload';

export class WordInputScreen extends BaseScreen {
  private currentTab: Tab = 'builtin';
  private selectedWords: Word[] = [];
  private selectedLists: Set<string> = new Set(['classic.txt']);
  private readonly targetWordCount: number = 50; // Target 40-50 cards per Monikers guidelines
  private readonly poolSize: number = 60; // 20% extra for swapping

  async render(): Promise<HTMLElement> {
    const header = this.createHeader('Add Words');

    // Tab navigation
    const tabs = this.createTabs();

    // Tab content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tab-content mb-lg';
    contentContainer.style.minHeight = '300px';

    // Buttons
    const continueButton = this.createButton(
      'Continue',
      () => this.handleContinue(),
      'btn btn-primary'
    );

    const backButton = this.createButton(
      'Back',
      () => getScreenManager().navigate('setup'),
      'btn btn-secondary'
    );

    const buttonGroup = this.createButtonGroup([backButton, continueButton]);

    this.container.appendChild(header);
    this.container.appendChild(tabs);
    this.container.appendChild(contentContainer);
    this.container.appendChild(buttonGroup);

    // Render initial tab content
    await this.renderTabContent(contentContainer);

    return this.container;
  }

  private createTabs(): HTMLElement {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs mb-md';
    tabsContainer.style.display = 'flex';
    tabsContainer.style.gap = 'var(--spacing-xs)';
    tabsContainer.style.borderBottom = '2px solid var(--color-border)';

    const tabs: Array<{ id: Tab; label: string }> = [
      { id: 'builtin', label: 'Built-in Lists' },
      { id: 'paste', label: 'Paste Text' },
      { id: 'upload', label: 'Upload File' },
    ];

    tabs.forEach(tab => {
      const button = document.createElement('button');
      button.textContent = tab.label;
      button.className = 'tab-button';
      button.style.padding = 'var(--spacing-sm) var(--spacing-md)';
      button.style.border = 'none';
      button.style.background = 'none';
      button.style.cursor = 'pointer';
      button.style.fontWeight = '600';
      button.style.color = this.currentTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)';
      button.style.borderBottom = this.currentTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent';
      button.style.transition = 'all var(--transition)';

      button.addEventListener('click', async () => {
        this.currentTab = tab.id;

        // Update tab styles
        tabsContainer.querySelectorAll('.tab-button').forEach((btn, index) => {
          (btn as HTMLElement).style.color = index === tabs.findIndex(t => t.id === tab.id)
            ? 'var(--color-primary)'
            : 'var(--color-text-secondary)';
          (btn as HTMLElement).style.borderBottom = index === tabs.findIndex(t => t.id === tab.id)
            ? '3px solid var(--color-primary)'
            : '3px solid transparent';
        });

        // Re-render content
        const contentContainer = this.container.querySelector('.tab-content') as HTMLElement;
        await this.renderTabContent(contentContainer);
      });

      tabsContainer.appendChild(button);
    });

    return tabsContainer;
  }

  private async renderTabContent(contentContainer: HTMLElement): Promise<void> {
    contentContainer.innerHTML = '';

    switch (this.currentTab) {
      case 'builtin':
        await this.renderBuiltInTab(contentContainer);
        break;
      case 'paste':
        this.renderPasteTab(contentContainer);
        break;
      case 'upload':
        this.renderUploadTab(contentContainer);
        break;
    }
  }

  private async renderBuiltInTab(container: HTMLElement): Promise<void> {
    const description = this.createParagraph(
      'Select one or more built-in word lists. We\'ll randomly choose 50 words from your selection.'
    );
    container.appendChild(description);

    const lists = [
      { filename: 'honeycomb.txt', name: 'Honeycomb', description: 'Inside jokes and company culture', count: 90 },
      { filename: 'classic.txt', name: 'Classic', description: 'Well-known people, places & things', count: 150 },
      { filename: 'pop-culture.txt', name: 'Pop Culture', description: 'Modern references', count: 150 },
      { filename: 'mixed.txt', name: 'Mixed', description: 'Varied difficulty words', count: 150 },
    ];

    for (const list of lists) {
      const checkbox = this.createListCheckbox(list);
      container.appendChild(checkbox);
    }

    // Load selected lists
    await this.loadSelectedLists();
  }

  private createListCheckbox(list: { filename: string; name: string; description: string; count: number }): HTMLElement {
    const container = document.createElement('label');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.padding = 'var(--spacing-sm)';
    container.style.marginBottom = 'var(--spacing-sm)';
    container.style.cursor = 'pointer';
    container.style.border = '2px solid var(--color-border)';
    container.style.borderRadius = 'var(--border-radius)';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.selectedLists.has(list.filename);
    checkbox.style.marginRight = 'var(--spacing-sm)';
    checkbox.style.width = '20px';
    checkbox.style.height = '20px';

    checkbox.addEventListener('change', async () => {
      if (checkbox.checked) {
        this.selectedLists.add(list.filename);
      } else {
        this.selectedLists.delete(list.filename);
      }
      await this.loadSelectedLists();
    });

    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';

    const name = document.createElement('div');
    name.textContent = list.name;
    name.style.fontWeight = '600';

    const description = document.createElement('div');
    description.textContent = list.description;
    description.style.fontSize = 'var(--font-size-sm)';
    description.style.color = 'var(--color-text-secondary)';

    textContainer.appendChild(name);
    textContainer.appendChild(description);

    container.appendChild(checkbox);
    container.appendChild(textContainer);

    return container;
  }

  private async loadSelectedLists(): Promise<void> {
    // Load all words from selected lists
    const allWords: Word[] = [];
    for (const filename of this.selectedLists) {
      const words = await loadBuiltInList(filename);
      allWords.push(...words);
    }

    // Select 60 words (target 50 + 10 extras for swapping)
    this.selectedWords = selectRandomSubset(allWords, this.poolSize);
  }

  private renderPasteTab(container: HTMLElement): void {
    const description = this.createParagraph('Paste your words below, one per line');
    container.appendChild(description);

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Beyoncé\nPizza\nMount Everest\n...';
    textarea.rows = 12;
    textarea.style.width = '100%';
    textarea.style.marginBottom = 'var(--spacing-md)';

    textarea.addEventListener('input', () => {
      const text = textarea.value.trim();
      this.selectedWords = text ? parseTextInput(text) : [];
    });

    container.appendChild(textarea);
  }

  private renderUploadTab(container: HTMLElement): void {
    const description = this.createParagraph('Upload a text file with one word per line');
    container.appendChild(description);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.style.marginBottom = 'var(--spacing-md)';

    const fileLabel = document.createElement('div');
    fileLabel.textContent = 'No file selected';
    fileLabel.style.fontSize = 'var(--font-size-sm)';
    fileLabel.style.color = 'var(--color-text-secondary)';
    fileLabel.style.marginTop = 'var(--spacing-sm)';

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (file) {
        fileLabel.textContent = `Selected: ${file.name}`;
        try {
          this.selectedWords = await parseTextFile(file);
        } catch (error) {
          fileLabel.textContent = 'Error reading file';
          fileLabel.style.color = 'var(--color-error)';
        }
      }
    });

    container.appendChild(fileInput);
    container.appendChild(fileLabel);
  }

  private handleContinue(): void {
    if (this.selectedWords.length === 0) {
      alert('Please select or add some words first!');
      return;
    }

    if (this.currentTab === 'builtin') {
      // For built-in lists, pass the full pool and mark which are initially selected
      const initiallySelected = selectRandomSubset(this.selectedWords, this.targetWordCount);
      const selectedIds = new Set(initiallySelected.map(w => w.id));

      sessionStorage.setItem('game-words-pool', JSON.stringify(this.selectedWords));
      sessionStorage.setItem('game-words-selected', JSON.stringify(Array.from(selectedIds)));
      sessionStorage.setItem('game-words-target', this.targetWordCount.toString());
    } else {
      // For paste/upload, just pass the words directly (all selected)
      sessionStorage.setItem('game-words', JSON.stringify(this.selectedWords));
    }

    getScreenManager().navigate('review');
  }
}
