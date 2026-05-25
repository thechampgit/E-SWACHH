'use client';

/**
 * A simple event emitter using the native EventTarget to avoid 'events' node polyfill issues.
 */
class ErrorEmitter {
  private target = new EventTarget();

  emit(type: string, detail: any) {
    this.target.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type: string, handler: (event: any) => void) {
    this.target.addEventListener(type, (e: any) => handler(e.detail));
  }

  off(type: string, handler: (event: any) => void) {
    this.target.removeEventListener(type, (e: any) => handler(e.detail));
  }
}

export const errorEmitter = new ErrorEmitter();
