import type { Screen } from '../types';
import { WelcomeScreen } from './WelcomeScreen';
import { SetupScreen } from './SetupScreen';
import { WordInputScreen } from './WordInputScreen';
import { ReviewScreen } from './ReviewScreen';
import { RoundIntroScreen } from './RoundIntroScreen';
import { TurnIntroScreen } from './TurnIntroScreen';
import { PlayScreen } from './PlayScreen';
import { TurnEndScreen } from './TurnEndScreen';
import { RoundEndScreen } from './RoundEndScreen';
import { GameEndScreen } from './GameEndScreen';

export class ScreenManager {
  private currentScreen: Screen = 'welcome';
  private appContainer: HTMLElement;
  private screens: Map<Screen, () => HTMLElement | Promise<HTMLElement>>;

  constructor(appContainer: HTMLElement) {
    this.appContainer = appContainer;
    this.screens = new Map();
    this.registerScreens();
  }

  private registerScreens(): void {
    this.screens.set('welcome', () => new WelcomeScreen().render());
    this.screens.set('setup', () => new SetupScreen().render());
    this.screens.set('word-input', () => new WordInputScreen().render());
    this.screens.set('review', () => new ReviewScreen().render());
    this.screens.set('round-intro', () => new RoundIntroScreen().render());
    this.screens.set('turn-intro', () => new TurnIntroScreen().render());
    this.screens.set('play', () => new PlayScreen().render());
    this.screens.set('turn-end', () => new TurnEndScreen().render());
    this.screens.set('round-end', () => new RoundEndScreen().render());
    this.screens.set('game-end', () => new GameEndScreen().render());
  }

  navigate(screen: Screen): void {
    this.currentScreen = screen;
    this.render();
  }

  private async render(): Promise<void> {
    const screenFactory = this.screens.get(this.currentScreen);
    if (!screenFactory) {
      console.error(`Screen not found: ${this.currentScreen}`);
      return;
    }

    // Clear and render new screen
    this.appContainer.innerHTML = '';
    const screenElement = await screenFactory();
    this.appContainer.appendChild(screenElement);
  }

  // Initial render
  init(): void {
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
