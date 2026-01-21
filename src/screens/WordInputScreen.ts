import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { loadBuiltInList, parseTextInput, parseTextFile } from '../utils/wordLoader';
import type { Word } from '../types';

type Tab = 'builtin' | 'paste' | 'upload';

export class WordInputScreen extends BaseScreen {
  private currentTab: Tab = 'builtin';
  private selectedWords: Word[] = [];
  private selectedLists: Set<string> = new Set(['classic.txt']);

  async render(): Promise<HTMLElement> {
    const header = this.createHeader('Add Words');

    // Tab navigation
    const tabs = this.createTabs();

    // Tab content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tab-content mb-lg';
    contentContainer.style.minHeight = '300px';

    // Word count
    const wordCount = document.createElement('div');
    wordCount.className = 'word-count text-center mb-md';
    wordCount.style.fontSize = 'var(--font-size-lg)';
    wordCount.style.fontWeight = '600';
    wordCount.style.color = 'var(--color-primary)';

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
    this.container.appendChild(wordCount);
    this.container.appendChild(buttonGroup);

    // Render initial tab content
    await this.renderTabContent(contentContainer, wordCount);

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
        const wordCount = this.container.querySelector('.word-count') as HTMLElement;
        await this.renderTabContent(contentContainer, wordCount);
      });

      tabsContainer.appendChild(button);
    });

    return tabsContainer;
  }

  private async renderTabContent(contentContainer: HTMLElement, wordCount: HTMLElement): Promise<void> {
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

    this.updateWordCount(wordCount);
  }

  private async renderBuiltInTab(container: HTMLElement): Promise<void> {
    const description = this.createParagraph('Select one or more built-in word lists');
    container.appendChild(description);

    const lists = [
      { filename: 'classic.txt', name: 'Classic', description: '50 well-known people, places & things', count: 50 },
      { filename: 'pop-culture.txt', name: 'Pop Culture', description: '50 modern references', count: 50 },
      { filename: 'mixed.txt', name: 'Mixed', description: '60 varied difficulty words', count: 60 },
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
      const wordCount = this.container.querySelector('.word-count') as HTMLElement;
      this.updateWordCount(wordCount);
    });

    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';

    const name = document.createElement('div');
    name.textContent = `${list.name} (${list.count} words)`;
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
    this.selectedWords = [];
    for (const filename of this.selectedLists) {
      const words = await loadBuiltInList(filename);
      this.selectedWords.push(...words);
    }
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
      const wordCount = this.container.querySelector('.word-count') as HTMLElement;
      this.updateWordCount(wordCount);
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
          const wordCount = this.container.querySelector('.word-count') as HTMLElement;
          this.updateWordCount(wordCount);
        } catch (error) {
          fileLabel.textContent = 'Error reading file';
          fileLabel.style.color = 'var(--color-error)';
        }
      }
    });

    container.appendChild(fileInput);
    container.appendChild(fileLabel);
  }

  private updateWordCount(element: HTMLElement): void {
    const count = this.selectedWords.length;
    element.textContent = count === 1
      ? '1 word selected'
      : `${count} words selected`;
  }

  private handleContinue(): void {
    if (this.selectedWords.length === 0) {
      alert('Please select or add some words first!');
      return;
    }

    sessionStorage.setItem('game-words', JSON.stringify(this.selectedWords));
    getScreenManager().navigate('review');
  }
}
