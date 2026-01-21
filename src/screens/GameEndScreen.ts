import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';

export class GameEndScreen extends BaseScreen {
  render(): HTMLElement {
    const state = getGameState().getState();

    const header = this.createHeader('Game Complete!');
    header.className = 'text-center mb-md';

    const emoji = document.createElement('div');
    emoji.textContent = '🎉 🎊 🎭 🏆';
    emoji.style.fontSize = 'var(--font-size-3xl)';
    emoji.className = 'text-center mb-lg';

    const celebration = this.createParagraph('Thanks for playing Triple Take!');
    celebration.className = 'text-center mb-lg';
    celebration.style.fontSize = 'var(--font-size-xl)';
    celebration.style.fontWeight = '600';

    // Overall stats
    const statsSection = document.createElement('div');
    statsSection.className = 'stats mb-lg';

    const statsTitle = document.createElement('h2');
    statsTitle.textContent = 'Game Summary';
    statsTitle.style.marginBottom = 'var(--spacing-sm)';
    statsSection.appendChild(statsTitle);

    const totalWords = state.allWords.length;
    const totalRounds = state.roundHistory.length;
    const totalTurns = state.roundHistory.reduce((sum, round) => sum + round.totalTurns, 0);

    const overallStats = [
      { label: 'Total Rounds', value: totalRounds },
      { label: 'Total Turns', value: totalTurns },
      { label: 'Words per Round', value: totalWords },
    ];

    overallStats.forEach(stat => {
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

    // Round-by-round breakdown
    const breakdownSection = document.createElement('div');
    breakdownSection.className = 'mb-lg';
    breakdownSection.style.maxHeight = '300px';
    breakdownSection.style.overflowY = 'auto';

    const breakdownTitle = document.createElement('h2');
    breakdownTitle.textContent = 'Round Breakdown';
    breakdownTitle.style.marginBottom = 'var(--spacing-sm)';
    breakdownSection.appendChild(breakdownTitle);

    state.roundHistory.forEach((round) => {
      const roundCard = document.createElement('div');
      roundCard.style.background = 'var(--color-bg)';
      roundCard.style.padding = 'var(--spacing-sm)';
      roundCard.style.borderRadius = 'var(--border-radius)';
      roundCard.style.border = '2px solid var(--color-border)';
      roundCard.style.marginBottom = 'var(--spacing-sm)';

      const roundTitle = document.createElement('div');
      const roundData = state.rounds[round.roundNumber - 1];
      roundTitle.textContent = `Round ${round.roundNumber}: ${roundData?.name || 'Unknown'}`;
      roundTitle.style.fontWeight = '600';
      roundTitle.style.marginBottom = 'var(--spacing-xs)';

      const roundInfo = document.createElement('div');
      roundInfo.style.fontSize = 'var(--font-size-sm)';
      roundInfo.style.color = 'var(--color-text-secondary)';
      roundInfo.textContent = `${round.wordsGuessed}/${round.totalWords} words in ${round.totalTurns} turns`;

      roundCard.appendChild(roundTitle);
      roundCard.appendChild(roundInfo);
      breakdownSection.appendChild(roundCard);
    });

    // Buttons
    const playAgainButton = this.createButton(
      'Play Again',
      () => this.handlePlayAgain(),
      'btn btn-success'
    );

    const homeButton = this.createButton(
      'Back to Home',
      () => {
        getGameState().resetGame();
        getScreenManager().navigate('welcome');
      },
      'btn btn-secondary'
    );

    const buttonGroup = this.createButtonGroup([homeButton, playAgainButton]);

    this.container.appendChild(header);
    this.container.appendChild(emoji);
    this.container.appendChild(celebration);
    this.container.appendChild(statsSection);
    this.container.appendChild(breakdownSection);
    this.container.appendChild(buttonGroup);

    return this.container;
  }

  private handlePlayAgain(): void {
    getGameState().resetGame();
    getScreenManager().navigate('setup');
  }
}
