import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import type { RoundType } from '../types';

export class SetupScreen extends BaseScreen {
  private selectedDuration: number = 60;
  private selectedRounds: Set<RoundType> = new Set(['describe', 'one-word', 'charades']);

  render(): HTMLElement {
    const header = this.createHeader('Game Setup');

    // Turn Duration Section
    const durationSection = this.createDurationSection();

    // Rounds Selection Section
    const roundsSection = this.createRoundsSection();

    // Buttons
    const nextButton = this.createButton(
      'Next: Choose Words',
      () => this.handleNext(),
      'btn btn-primary'
    );

    const backButton = this.createButton(
      'Back',
      () => getScreenManager().navigate('welcome'),
      'btn btn-secondary'
    );

    const buttonGroup = this.createButtonGroup([backButton, nextButton]);

    this.container.appendChild(header);
    this.container.appendChild(durationSection);
    this.container.appendChild(roundsSection);
    this.container.appendChild(buttonGroup);

    return this.container;
  }

  private createDurationSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'mb-lg';

    const label = document.createElement('h2');
    label.textContent = 'Turn Duration';
    section.appendChild(label);

    const description = this.createParagraph('How long should each turn last?');
    description.className = 'mb-md';
    section.appendChild(description);

    // Container for the duration control
    const durationControl = document.createElement('div');
    durationControl.className = 'duration-control';
    durationControl.style.display = 'flex';
    durationControl.style.alignItems = 'center';
    durationControl.style.justifyContent = 'center';
    durationControl.style.gap = 'var(--spacing-sm)';

    // Decrement button
    const decrementBtn = document.createElement('button');
    decrementBtn.textContent = '−';
    decrementBtn.className = 'btn btn-secondary';
    decrementBtn.style.width = '50px';
    decrementBtn.style.height = '50px';
    decrementBtn.style.fontSize = 'var(--font-size-xl)';
    decrementBtn.style.padding = '0';

    // Duration display
    const durationDisplay = document.createElement('div');
    durationDisplay.className = 'duration-display';
    durationDisplay.textContent = `${this.selectedDuration}s`;
    durationDisplay.style.fontSize = 'var(--font-size-lg)';
    durationDisplay.style.fontWeight = '600';
    durationDisplay.style.minWidth = '100px';
    durationDisplay.style.textAlign = 'center';
    durationDisplay.style.padding = 'var(--spacing-sm)';
    durationDisplay.style.border = '2px solid var(--color-border)';
    durationDisplay.style.borderRadius = 'var(--border-radius)';
    durationDisplay.style.backgroundColor = 'var(--color-surface)';

    // Increment button
    const incrementBtn = document.createElement('button');
    incrementBtn.textContent = '+';
    incrementBtn.className = 'btn btn-secondary';
    incrementBtn.style.width = '50px';
    incrementBtn.style.height = '50px';
    incrementBtn.style.fontSize = 'var(--font-size-xl)';
    incrementBtn.style.padding = '0';

    // Event handlers
    const updateDuration = (newDuration: number) => {
      // Clamp between 15 and 300 seconds (5 minutes)
      this.selectedDuration = Math.max(15, Math.min(300, newDuration));
      durationDisplay.textContent = `${this.selectedDuration}s`;
    };

    decrementBtn.addEventListener('click', () => {
      updateDuration(this.selectedDuration - 15);
    });

    incrementBtn.addEventListener('click', () => {
      updateDuration(this.selectedDuration + 15);
    });

    durationControl.appendChild(decrementBtn);
    durationControl.appendChild(durationDisplay);
    durationControl.appendChild(incrementBtn);

    section.appendChild(durationControl);
    return section;
  }

  private createRoundsSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'mb-lg';

    const label = document.createElement('h2');
    label.textContent = 'Rounds to Play';
    section.appendChild(label);

    const description = this.createParagraph('Select which rounds you want to include (minimum 1)');
    description.className = 'mb-md';
    section.appendChild(description);

    const rounds: Array<{ type: RoundType; name: string; description: string }> = [
      { type: 'describe', name: 'Round 1: Describe', description: 'Use any words or gestures' },
      { type: 'one-word', name: 'Round 2: One Word', description: 'Give only one word as a clue' },
      { type: 'charades', name: 'Round 3: Charades', description: 'Act it out, no words' },
      { type: 'bedsheet', name: 'Round 4: Bedsheet', description: 'Act under a bedsheet' },
      { type: 'sounds', name: 'Round 5: Sound Effects', description: 'Sound effects only' },
    ];

    rounds.forEach(round => {
      const checkbox = this.createRoundCheckbox(round);
      section.appendChild(checkbox);
    });

    return section;
  }

  private createRoundCheckbox(round: { type: RoundType; name: string; description: string }): HTMLElement {
    const container = document.createElement('label');
    container.className = 'round-checkbox';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.padding = 'var(--spacing-sm)';
    container.style.marginBottom = 'var(--spacing-sm)';
    container.style.cursor = 'pointer';
    container.style.border = '2px solid var(--color-border)';
    container.style.borderRadius = 'var(--border-radius)';
    container.style.transition = 'border-color var(--transition)';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = this.selectedRounds.has(round.type);
    checkbox.style.marginRight = 'var(--spacing-sm)';
    checkbox.style.width = '20px';
    checkbox.style.height = '20px';
    checkbox.style.cursor = 'pointer';

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        this.selectedRounds.add(round.type);
      } else {
        // Don't allow unchecking if it's the last one
        if (this.selectedRounds.size > 1) {
          this.selectedRounds.delete(round.type);
        } else {
          checkbox.checked = true;
        }
      }
    });

    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';

    const name = document.createElement('div');
    name.textContent = round.name;
    name.style.fontWeight = '600';
    name.style.color = 'var(--color-text)';

    const description = document.createElement('div');
    description.textContent = round.description;
    description.style.fontSize = 'var(--font-size-sm)';
    description.style.color = 'var(--color-text-secondary)';

    textContainer.appendChild(name);
    textContainer.appendChild(description);

    container.appendChild(checkbox);
    container.appendChild(textContainer);

    return container;
  }

  private handleNext(): void {
    // Store configuration in sessionStorage temporarily
    const config = {
      turnDuration: this.selectedDuration,
      enabledRounds: Array.from(this.selectedRounds),
      allowSkipping: true,
    };

    sessionStorage.setItem('game-config', JSON.stringify(config));
    getScreenManager().navigate('word-input');
  }
}
