import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';

export class TurnIntroScreen extends BaseScreen {
  render(): HTMLElement {
    const state = getGameState().getState();
    const currentRound = state.rounds[state.currentRound - 1];

    if (!currentRound) {
      getScreenManager().navigate('welcome');
      return this.container;
    }

    const header = this.createHeader('Pass the Device');
    header.className = 'text-center mb-md';

    const emoji = document.createElement('div');
    emoji.textContent = '📱 ➡️ 👤';
    emoji.style.fontSize = 'var(--font-size-3xl)';
    emoji.className = 'text-center mb-lg';

    const instruction = this.createParagraph(
      'Hand the device to the next player who will give clues.'
    );
    instruction.className = 'text-center mb-lg';
    instruction.style.fontSize = 'var(--font-size-lg)';

    // Round reminder
    const roundReminder = document.createElement('div');
    roundReminder.className = 'mb-lg text-center';
    roundReminder.style.padding = 'var(--spacing-md)';
    roundReminder.style.background = 'var(--color-bg)';
    roundReminder.style.borderRadius = 'var(--border-radius)';
    roundReminder.style.border = '2px solid var(--color-primary)';

    const roundTitle = document.createElement('div');
    roundTitle.textContent = `Round ${currentRound.number}: ${currentRound.name}`;
    roundTitle.style.fontWeight = '700';
    roundTitle.style.fontSize = 'var(--font-size-lg)';
    roundTitle.style.marginBottom = 'var(--spacing-xs)';
    roundTitle.style.color = 'var(--color-primary)';

    const roundInstructions = document.createElement('div');
    roundInstructions.textContent = currentRound.instructions;
    roundInstructions.style.color = 'var(--color-text-secondary)';

    roundReminder.appendChild(roundTitle);
    roundReminder.appendChild(roundInstructions);

    // Progress info
    const progress = this.createParagraph(
      `${state.remainingWords.length} words remaining`
    );
    progress.className = 'text-center mb-lg';
    progress.style.fontSize = 'var(--font-size-lg)';
    progress.style.fontWeight = '600';
    progress.style.color = 'var(--color-success)';

    // Start button
    const startButton = this.createButton(
      'Start Turn',
      () => this.handleStartTurn(),
      'btn btn-success'
    );
    startButton.style.width = '100%';
    startButton.style.maxWidth = '400px';
    startButton.style.margin = '0 auto';
    startButton.style.display = 'block';

    this.container.appendChild(header);
    this.container.appendChild(emoji);
    this.container.appendChild(instruction);
    this.container.appendChild(roundReminder);
    this.container.appendChild(progress);
    this.container.appendChild(startButton);

    return this.container;
  }

  private handleStartTurn(): void {
    getGameState().startTurn();
    getScreenManager().navigate('play');
  }
}
