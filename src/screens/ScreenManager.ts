import type { Screen } from '../types';
import { getGameState } from '../state/GameState';
import { BaseScreen } from './BaseScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { SetupScreen } from './SetupScreen';
import { WordInputScreen } from './WordInputScreen';
import { ReviewScreen } from './ReviewScreen';
import { RefineScreen } from './RefineScreen';
import { PlayerWordSelectionScreen } from './PlayerWordSelectionScreen';
import { RoundIntroScreen } from './RoundIntroScreen';
import { TurnIntroScreen } from './TurnIntroScreen';
import { PlayScreen } from './PlayScreen';
import { TurnEndScreen } from './TurnEndScreen';
import { RoundEndScreen } from './RoundEndScreen';
import { GameEndScreen } from './GameEndScreen';

// Screens that are only meaningful while a game is in progress.
// Refreshing on any of these should restore the player to the same screen;
// other screens (welcome/setup/word-input/etc.) lose ephemeral form state on refresh
// and so fall back to the welcome screen.
const RESTORABLE_SCREENS: ReadonlySet<Screen> = new Set<Screen>([
  'round-intro',
  'turn-intro',
  'play',
  'turn-end',
  'round-end',
  'game-end',
]);

export class ScreenManager {
  private currentScreen: Screen = 'welcome';
  private appContainer: HTMLElement;
  private screens: Map<Screen, () => BaseScreen>;
  private activeScreen: BaseScreen | null = null;

  constructor(appContainer: HTMLElement) {
    this.appContainer = appContainer;
    this.screens = new Map();
    this.registerScreens();

    window.addEventListener('popstate', (event) => {
      const state = event.state as { screen?: Screen } | null;
      const screen = state?.screen ?? this.resolveStartScreen();
      this.currentScreen = screen;
      getGameState().setCurrentScreen(screen);
      this.render();
    });
  }

  private registerScreens(): void {
    this.screens.set('welcome', () => new WelcomeScreen());
    this.screens.set('setup', () => new SetupScreen());
    this.screens.set('word-input', () => new WordInputScreen());
    this.screens.set('review', () => new ReviewScreen());
    this.screens.set('refine', () => new RefineScreen());
    this.screens.set('player-word-selection', () => new PlayerWordSelectionScreen());
    this.screens.set('round-intro', () => new RoundIntroScreen());
    this.screens.set('turn-intro', () => new TurnIntroScreen());
    this.screens.set('play', () => new PlayScreen());
    this.screens.set('turn-end', () => new TurnEndScreen());
    this.screens.set('round-end', () => new RoundEndScreen());
    this.screens.set('game-end', () => new GameEndScreen());
  }

  navigate(screen: Screen): void {
    this.currentScreen = screen;
    getGameState().setCurrentScreen(screen);
    history.pushState({ screen }, '');
    this.render();
  }

  private async render(): Promise<void> {
    const screenFactory = this.screens.get(this.currentScreen);
    if (!screenFactory) {
      console.error(`Screen not found: ${this.currentScreen}`);
      return;
    }

    // Clean up the previous screen (stop timers, remove listeners, etc.)
    if (this.activeScreen) {
      this.activeScreen.cleanup();
      this.activeScreen = null;
    }

    // Clear and render new screen
    this.appContainer.innerHTML = '';
    const screen = screenFactory();
    this.activeScreen = screen;
    const screenElement = await screen.render();
    this.appContainer.appendChild(screenElement);
  }

  private resolveStartScreen(): Screen {
    const state = getGameState().getState();
    if (state.gameStarted && RESTORABLE_SCREENS.has(state.currentScreen)) {
      return state.currentScreen;
    }
    return 'welcome';
  }

  // Initial render
  init(): void {
    this.currentScreen = this.resolveStartScreen();
    getGameState().setCurrentScreen(this.currentScreen);
    history.replaceState({ screen: this.currentScreen }, '');
    this.render();
  }
}

// Export singleton instance
let screenManagerInstance: ScreenManager | null = null;

export function initScreenManager(appContainer: HTMLElement): ScreenManager {
  screenManagerInstance = new ScreenManager(appContainer);
  return screenManagerInstance;
}

export function getScreenManager(): ScreenManager {
  if (!screenManagerInstance) {
    throw new Error('ScreenManager not initialized. Call initScreenManager first.');
  }
  return screenManagerInstance;
}
