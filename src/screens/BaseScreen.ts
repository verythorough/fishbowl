import { getGameState } from '../state/GameState';
import { getScreenManager } from './ScreenManager';

export abstract class BaseScreen {
  protected container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'screen';
  }

  abstract render(): HTMLElement | Promise<HTMLElement>;

  /**
   * Optional hook called by the ScreenManager before navigating away from this screen.
   * Override to stop timers, remove global listeners, etc.
   */
  cleanup(): void {}

  /**
   * Quit button shown at the bottom of in-game screens. Opens a confirmation modal
   * before discarding the saved game and returning to the welcome screen.
   */
  protected createQuitButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = 'Quit Game';
    button.className = 'btn btn-secondary quit-btn';
    button.addEventListener('click', () => this.handleQuitClick());
    return button;
  }

  protected handleQuitClick(): void {
    this.showQuitConfirmation();
  }

  protected showQuitConfirmation(onCancel?: () => void): void {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    const title = document.createElement('h2');
    title.textContent = 'Quit Game?';
    title.className = 'text-center mb-sm';

    const message = document.createElement('p');
    message.textContent = 'This will end the current game and return to the start screen. Your progress will be lost.';
    message.className = 'text-center mb-md';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Keep Playing';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.addEventListener('click', () => {
      overlay.remove();
      onCancel?.();
    });

    const quitButton = document.createElement('button');
    quitButton.textContent = 'Quit';
    quitButton.className = 'btn btn-warning';
    quitButton.addEventListener('click', () => {
      overlay.remove();
      getGameState().resetGame();
      getScreenManager().navigate('welcome');
    });

    const buttonRow = document.createElement('div');
    buttonRow.className = 'button-group';
    buttonRow.appendChild(cancelButton);
    buttonRow.appendChild(quitButton);

    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(buttonRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  protected createButton(
    text: string,
    onClick: () => void,
    className: string = 'btn btn-primary'
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', onClick);
    return button;
  }

  protected createHeader(text: string, level: 1 | 2 = 1): HTMLHeadingElement {
    const header = document.createElement(`h${level}`) as HTMLHeadingElement;
    header.textContent = text;
    return header;
  }

  protected createParagraph(text: string): HTMLParagraphElement {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  }

  protected createButtonGroup(buttons: HTMLButtonElement[], vertical: boolean = false): HTMLDivElement {
    const group = document.createElement('div');
    group.className = vertical ? 'button-group button-group-vertical' : 'button-group';
    buttons.forEach(button => group.appendChild(button));
    return group;
  }
}
