

type AnyFunction = (...args: any) => any;
type PromiseWithProperties<T, Addon extends {}> = Promise<T> & Addon

export function throttle<Fn extends AnyFunction>(fn: Fn, time: number | (() => Promise<void>)) {
  let promise: PromiseWithProperties<void, { isCanceled: boolean }> | null = null;

  return (...params: Parameters<Fn>) => {
    if (promise) {
      promise.isCanceled = true;
    }

    if (typeof time === 'number') {
      const newPromise = new Promise<void>((resolve) => {
        setTimeout(() => resolve(), time);
      });
      promise = Object.assign(newPromise, { isCanceled: false });
    }
    if (time instanceof Function) {
      const newPromise = time();
      promise = Object.assign(newPromise, { isCanceled: false });
    }
    
    if (promise && !promise.isCanceled) {
      promise?.then(() => {
        if (!promise?.isCanceled) fn(...params);
      })
    }

    return {
      cancel: () => {
        if (promise) {
          promise.isCanceled = true;
        }
      }
    }
  }
}
