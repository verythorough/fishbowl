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

    const durations = [30, 45, 60, 90, 120];
    const durationButtons = document.createElement('div');
    durationButtons.className = 'button-group';

    durations.forEach(duration => {
      const button = document.createElement('button');
      button.textContent = `${duration}s`;
      button.className = duration === this.selectedDuration
        ? 'btn btn-primary'
        : 'btn btn-secondary';

      button.addEventListener('click', () => {
        this.selectedDuration = duration;
        // Update button styles
        durationButtons.querySelectorAll('button').forEach(btn => {
          btn.className = 'btn btn-secondary';
        });
        button.className = 'btn btn-primary';
      });

      durationButtons.appendChild(button);
    });

    section.appendChild(durationButtons);
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
