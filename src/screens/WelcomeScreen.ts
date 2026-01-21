import { BaseScreen } from './BaseScreen';
import { getScreenManager } from './ScreenManager';

export class WelcomeScreen extends BaseScreen {
  render(): HTMLElement {
    const header = this.createHeader('Triple Take');
    header.className = 'text-center mb-lg';

    const subtitle = this.createParagraph('A cooperative word-guessing party game');
    subtitle.className = 'text-center mb-lg';

    const emoji = document.createElement('div');
    emoji.textContent = '🎭 🎲 🎪';
    emoji.style.fontSize = 'var(--font-size-3xl)';
    emoji.className = 'text-center mb-lg';

    const newGameButton = this.createButton(
      'Start New Game',
      () => getScreenManager().navigate('setup'),
      'btn btn-primary'
    );

    // TODO: Add "Continue Game" button if saved game exists
    // const continueButton = this.createButton(
    //   'Continue Saved Game',
    //   () => getScreenManager().navigate('turn-intro'),
    //   'btn btn-secondary'
    // );

    const buttonGroup = this.createButtonGroup([newGameButton], true);

    this.container.appendChild(header);
    this.container.appendChild(emoji);
    this.container.appendChild(subtitle);
    this.container.appendChild(buttonGroup);

    return this.container;
  }
}
