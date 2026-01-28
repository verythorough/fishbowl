import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';

export class RoundEndScreen extends BaseScreen {
  render(): HTMLElement {
    const state = getGameState().getState();
    const completedRound = state.rounds[state.currentRound - 1];
    const roundStats = state.roundHistory[state.roundHistory.length - 1];

    if (!completedRound || !roundStats) {
      getScreenManager().navigate('welcome');
      return this.container;
    }

    const header = this.createHeader(`Round ${completedRound.number} Complete!`);
    header.className = 'text-center mb-md';

    const emoji = document.createElement('div');
    emoji.textContent = '🎉 🎊 ✨';
    emoji.style.fontSize = 'var(--font-size-3xl)';
    emoji.className = 'text-center mb-lg';

    // Round stats
    const statsSection = document.createElement('div');
    statsSection.className = 'stats mb-lg';

    const statsTitle = document.createElement('h2');
    statsTitle.textContent = 'Round Results';
    statsTitle.style.marginBottom = 'var(--spacing-sm)';
    statsSection.appendChild(statsTitle);

    const stats = [
      { label: 'Words Guessed', value: `${roundStats.wordsGuessed} / ${roundStats.totalWords}` },
      { label: 'Total Turns', value: roundStats.totalTurns },
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

    // Encouragement message
    const message = this.createParagraph(
      this.getEncouragementMessage(roundStats.wordsGuessed, roundStats.totalWords)
    );
    message.className = 'text-center mb-lg';
    message.style.fontSize = 'var(--font-size-lg)';
    message.style.fontStyle = 'italic';
    message.style.color = 'var(--color-primary)';

    // Check if game is complete
    const isGameComplete = state.gameCompleted;

    const nextButton = this.createButton(
      isGameComplete ? 'View Final Results' : 'Next Round',
      () => {
        if (isGameComplete) {
          getScreenManager().navigate('game-end');
        } else {
          getScreenManager().navigate('round-intro');
        }
      },
      'btn btn-success'
    );
    nextButton.style.width = '100%';
    nextButton.style.maxWidth = '400px';
    nextButton.style.margin = '0 auto';
    nextButton.style.display = 'block';

    this.container.appendChild(header);
    this.container.appendChild(emoji);
    this.container.appendChild(statsSection);
    this.container.appendChild(message);
    this.container.appendChild(nextButton);

    return this.container;
  }

  private getEncouragementMessage(guessed: number, total: number): string {
    const percentage = (guessed / total) * 100;

    if (percentage === 100) {
      return 'Perfect! You got them all! 🏆';
    } else if (percentage >= 80) {
      return 'Amazing teamwork! 🌟';
    } else if (percentage >= 60) {
      return 'Great job! Keep it up! 💪';
    } else if (percentage >= 40) {
      return 'Good effort! You\'ll do even better next time! 👏';
    } else {
      return 'Nice try! The next round will be easier! 😊';
    }
  }
}
