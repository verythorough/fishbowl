export abstract class BaseScreen {
  protected container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'screen';
  }

  abstract render(): HTMLElement;

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
