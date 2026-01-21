import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';

export class TurnEndScreen extends BaseScreen {
  render(): HTMLElement {
    const state = getGameState().getState();
    const currentRound = state.rounds[state.currentRound - 1];

    if (!currentRound) {
      getScreenManager().navigate('welcome');
      return this.container;
    }

    // Get the most recent turn stats
    const currentRoundHistory = state.roundHistory[state.roundHistory.length - 1];
    const lastTurn = currentRoundHistory?.turnHistory[currentRoundHistory.turnHistory.length - 1];

    const header = this.createHeader('Turn Complete!');
    header.className = 'text-center mb-md';

    const emoji = document.createElement('div');
    emoji.textContent = lastTurn && lastTurn.wordsGuessed > 0 ? '🎉' : '👍';
    emoji.style.fontSize = 'var(--font-size-3xl)';
    emoji.className = 'text-center mb-lg';

    // Turn stats
    const statsSection = document.createElement('div');
    statsSection.className = 'stats mb-lg';

    const statsTitle = document.createElement('h2');
    statsTitle.textContent = 'This Turn';
    statsTitle.style.marginBottom = 'var(--spacing-sm)';
    statsSection.appendChild(statsTitle);

    if (lastTurn) {
      const stats = [
        { label: 'Words Guessed', value: lastTurn.wordsGuessed },
        { label: 'Words Skipped', value: lastTurn.wordsSkipped },
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
        statsSection.appendChild(row);
      });
    }

    // Progress info
    const progress = this.createParagraph(
      `${state.remainingWords.length} words remaining in this round`
    );
    progress.className = 'text-center mb-lg';
    progress.style.fontSize = 'var(--font-size-lg)';
    progress.style.fontWeight = '600';

    // Check if round is complete
    const isRoundComplete = state.remainingWords.length === 0;

    const nextButton = this.createButton(
      isRoundComplete ? 'View Round Results' : 'Pass Device',
      () => {
        if (isRoundComplete) {
          getScreenManager().navigate('round-end');
        } else {
          getScreenManager().navigate('turn-intro');
        }
      },
      'btn btn-primary'
    );

    this.container.appendChild(header);
    this.container.appendChild(emoji);
    this.container.appendChild(statsSection);
    this.container.appendChild(progress);
    this.container.appendChild(nextButton);

    return this.container;
  }
}
