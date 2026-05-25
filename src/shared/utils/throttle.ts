



export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
) {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any;

  const invoke = (time: number) => {
    lastCallTime = time;
    fn.apply(lastThis, lastArgs as Parameters<T>);
    lastArgs = lastThis = null;
  };

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (!lastCallTime) {
      lastCallTime = now;
      return invoke(now);
    }

    const remaining = wait - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }

      invoke(now);
    } else if (!timerId) {
      timerId = setTimeout(() => {
        timerId = null;
        lastCallTime = Date.now();

        invoke(Date.now());
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timerId) {
      clearTimeout(timerId);
    }

    timerId = null;
    lastCallTime = 0;
    lastArgs = lastThis = null;
  };

  return throttled as T & { cancel: () => void };
}