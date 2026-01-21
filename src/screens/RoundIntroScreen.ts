import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';

export class RoundIntroScreen extends BaseScreen {
  render(): HTMLElement {
    const state = getGameState().getState();
    const currentRound = state.rounds[state.currentRound - 1];

    if (!currentRound) {
      // Error state, go back to welcome
      getScreenManager().navigate('welcome');
      return this.container;
    }

    const header = this.createHeader(`Round ${currentRound.number}: ${currentRound.name}`);
    header.className = 'text-center mb-md';

    const emoji = document.createElement('div');
    emoji.textContent = this.getRoundEmoji(currentRound.number);
    emoji.style.fontSize = 'var(--font-size-3xl)';
    emoji.className = 'text-center mb-md';

    const instructions = this.createParagraph(currentRound.instructions);
    instructions.className = 'text-center mb-lg';
    instructions.style.fontSize = 'var(--font-size-lg)';

    // Show previous round stats if available
    const statsSection = this.createStatsSection();

    // How to play section
    const howToPlay = this.createHowToPlaySection(state.config.turnDuration);

    // Start button
    const startButton = this.createButton(
      'Start First Turn',
      () => getScreenManager().navigate('turn-intro'),
      'btn btn-success'
    );

    this.container.appendChild(header);
    this.container.appendChild(emoji);
    this.container.appendChild(instructions);

    if (statsSection) {
      this.container.appendChild(statsSection);
    }

    this.container.appendChild(howToPlay);
    this.container.appendChild(startButton);

    return this.container;
  }

  private getRoundEmoji(roundNumber: number): string {
    const emojis = ['🗣️', '☝️', '🎭', '👻', '🔊'];
    return emojis[roundNumber - 1] || '🎲';
  }

  private createStatsSection(): HTMLElement | null {
    const state = getGameState().getState();

    // Only show stats if we have completed rounds
    if (state.roundHistory.length === 0) {
      return null;
    }

    const lastRound = state.roundHistory[state.roundHistory.length - 1];
    if (!lastRound) return null;

    const section = document.createElement('div');
    section.className = 'stats mb-lg';

    const title = document.createElement('h2');
    title.textContent = `Round ${lastRound.roundNumber} Results`;
    title.style.fontSize = 'var(--font-size-lg)';
    title.style.marginBottom = 'var(--spacing-sm)';
    section.appendChild(title);

    const stats = [
      { label: 'Words Guessed', value: `${lastRound.wordsGuessed} / ${lastRound.totalWords}` },
      { label: 'Total Turns', value: lastRound.totalTurns },
    ];

    stats.forEach(stat => {
      const row = document.createElement('div');
      row.className = 'stat-row';

      const label = document.createElement('span');
      label.className = 'stat-label';
      label.textContent = stat.label;

      const value = document.createElement('span');
      value.className = 'stat-value';
      value.textContent = String(stat.value);

      row.appendChild(label);
      row.appendChild(value);
      section.appendChild(row);
    });

    return section;
  }

  private createHowToPlaySection(turnDuration: number): HTMLElement {
    const section = document.createElement('div');
    section.className = 'mb-lg';
    section.style.background = 'var(--color-bg)';
    section.style.padding = 'var(--spacing-md)';
    section.style.borderRadius = 'var(--border-radius)';
    section.style.border = '2px solid var(--color-border)';

    const title = document.createElement('h2');
    title.textContent = 'How It Works';
    title.style.fontSize = 'var(--font-size-lg)';
    title.style.marginBottom = 'var(--spacing-sm)';
    section.appendChild(title);

    const instructions = [
      `Each player gets ${turnDuration} seconds to give clues`,
      'Pass the device to the next player after each turn',
      'Keep going until all words are guessed',
      'You can skip words - they\'ll come back later!',
    ];

    instructions.forEach(instruction => {
      const p = document.createElement('p');
      p.textContent = `• ${instruction}`;
      p.style.marginBottom = 'var(--spacing-xs)';
      p.style.color = 'var(--color-text-secondary)';
      section.appendChild(p);
    });

    return section;
  }
}
