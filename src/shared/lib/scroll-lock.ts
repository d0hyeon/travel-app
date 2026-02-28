
type RestoreValue = {
  overflow: string;
  touchAction: string;
}

export class ScrollLock {
  private count: number = 0;
  private restoreValue: RestoreValue | null = null;
  element: HTMLElement | null;

  constructor(element: HTMLElement = document.body) {
    this.element = element;
  }

  static of(element: HTMLElement) {
    return new ScrollLock(element);
  }

  lock() {
    if (this.element == null) return;
    this.restoreValue = {
      overflow: this.element.style.overflow,
      touchAction: this.element.style.touchAction,
    }

    this.element.style.overflow = 'hidden';
    this.element.style.touchAction = 'none';

    this.count++;
  }
  unlock() {
    if (this.count === 1) {
      this.restoreStyle();
    }
    this.count--;
  }

  
  setElement(element: HTMLElement) {
    this.reset();
    this.element = element;
  }

  reset() {
    this.restoreStyle();
    this.count = 0;
    this.element = null;
  }

  private restoreStyle() {
    if (this.element == null) return;
    this.element.style.overflow = this.restoreValue?.overflow ?? '';
    this.element.style.touchAction = this.restoreValue?.touchAction ?? '';
  }
}

export const scrollLock = new ScrollLock(document.body)