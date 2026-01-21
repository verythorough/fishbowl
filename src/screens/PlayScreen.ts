import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';
import { getGameState } from '../state/GameState';
import { Timer } from '../components/Timer';

export class PlayScreen extends BaseScreen {
  private timer: Timer | null = null;
  private unsubscribe: (() => void) | null = null;

  render(): HTMLElement {
    const state = getGameState().getState();
    const currentRound = state.rounds[state.currentRound - 1];

    if (!currentRound || state.remainingWords.length === 0) {
      // Round is complete!
      getScreenManager().navigate('round-end');
      return this.container;
    }

    // Header with round info and pause button
    const header = this.createHeader(currentRound.name);

    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.marginBottom = 'var(--spacing-md)';

    const roundInfo = document.createElement('div');
    roundInfo.textContent = `Round ${currentRound.number}`;
    roundInfo.style.fontSize = 'var(--font-size-lg)';
    roundInfo.style.fontWeight = '600';

    const pauseButton = document.createElement('button');
    pauseButton.textContent = '⏸ Pause';
    pauseButton.className = 'btn btn-secondary';
    pauseButton.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    pauseButton.addEventListener('click', () => this.handlePause());

    topBar.appendChild(roundInfo);
    topBar.appendChild(pauseButton);

    // Timer display
    const timerDisplay = document.createElement('div');
    timerDisplay.className = 'timer mb-sm';
    timerDisplay.id = 'timer-display';
    timerDisplay.textContent = this.formatTime(state.turn.timeRemaining);

    // Progress indicator
    const progress = document.createElement('div');
    progress.className = 'progress mb-md';
    progress.id = 'progress-display';
    progress.textContent = `${state.guessedWords.length} / ${state.allWords.length} words`;

    // Word card
    const currentWord = state.remainingWords[state.turn.currentWordIndex];
    const wordCard = document.createElement('div');
    wordCard.className = 'word-card';
    wordCard.id = 'word-display';
    wordCard.textContent = currentWord?.text || 'No more words!';

    // Buttons
    const gotItButton = this.createButton(
      'Got It! ✓',
      () => this.handleGotIt(),
      'btn btn-success'
    );
    gotItButton.style.width = '100%';
    gotItButton.style.marginBottom = 'var(--spacing-sm)';

    const skipButton = this.createButton(
      'Skip ↻',
      () => this.handleSkip(),
      'btn btn-warning'
    );
    skipButton.style.width = '100%';

    this.container.appendChild(topBar);
    this.container.appendChild(timerDisplay);
    this.container.appendChild(progress);
    this.container.appendChild(wordCard);
    this.container.appendChild(gotItButton);
    this.container.appendChild(skipButton);

    // Start the timer
    this.startTimer();

    // Subscribe to state changes to update display
    this.unsubscribe = getGameState().subscribe((newState) => {
      this.updateDisplay(newState);
    });

    return this.container;
  }

  private startTimer(): void {
    const state = getGameState().getState();

    this.timer = new Timer({
      onTick: (remaining) => {
        getGameState().updateTimer(remaining);
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
          timerDisplay.textContent = this.formatTime(remaining);

          // Add warning class when time is low
          if (remaining <= 10) {
            timerDisplay.className = 'timer danger';
          } else if (remaining <= 30) {
            timerDisplay.className = 'timer warning';
          } else {
            timerDisplay.className = 'timer';
          }
        }
      },
      onComplete: () => {
        this.handleTurnEnd();
      },
    });

    this.timer.start(state.turn.timeRemaining);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private updateDisplay(state: typeof getGameState extends () => { getState: () => infer S } ? S : never): void {
    // Update word display
    const wordDisplay = document.getElementById('word-display');
    if (wordDisplay) {
      const currentWord = state.remainingWords[state.turn.currentWordIndex];
      wordDisplay.textContent = currentWord?.text || 'No more words!';
    }

    // Update progress
    const progressDisplay = document.getElementById('progress-display');
    if (progressDisplay) {
      progressDisplay.textContent = `${state.guessedWords.length} / ${state.allWords.length} words`;
    }

    // Note: Round completion navigation is handled in handleGotIt() to avoid race conditions
  }

  private handleGotIt(): void {
    const stateBefore = getGameState().getState();
    const willCompleteRound = stateBefore.remainingWords.length === 1;

    getGameState().markWordCorrect();

    // If this was the last word, navigate immediately to round-end
    if (willCompleteRound) {
      this.cleanup();
      getScreenManager().navigate('round-end');
    }
  }

  private handleSkip(): void {
    getGameState().skipWord();
  }

  private handlePause(): void {
    this.timer?.pause();
    getGameState().pauseTurn();

    // Show pause overlay
    this.showPauseOverlay();
  }

  private showPauseOverlay(): void {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';

    const pauseText = document.createElement('div');
    pauseText.textContent = 'PAUSED';
    pauseText.style.fontSize = 'var(--font-size-3xl)';
    pauseText.style.fontWeight = 'bold';
    pauseText.style.color = 'white';
    pauseText.style.marginBottom = 'var(--spacing-lg)';

    const resumeButton = document.createElement('button');
    resumeButton.textContent = 'Resume';
    resumeButton.className = 'btn btn-success';
    resumeButton.style.fontSize = 'var(--font-size-xl)';
    resumeButton.style.padding = 'var(--spacing-md) var(--spacing-xl)';

    resumeButton.addEventListener('click', () => {
      const state = getGameState().getState();
      this.timer?.resume(state.turn.timeRemaining);
      getGameState().resumeTurn();
      overlay.remove();
    });

    overlay.appendChild(pauseText);
    overlay.appendChild(resumeButton);
    document.body.appendChild(overlay);
  }

  private handleTurnEnd(): void {
    getGameState().endTurn();
    this.cleanup();
    getScreenManager().navigate('turn-end');
  }

  private cleanup(): void {
    this.timer?.stop();
    this.timer = null;
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
