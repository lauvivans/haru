import { useSyncExternalStore } from 'react';

// A value kept in localStorage that React and the pixel art can both read.
// Storage can be blocked (private mode), so every access is guarded.
export function stored<T extends string>(
  key: string,
  initial: () => T,
  isValid: (v: string) => v is T,
) {
  let value: T = initial();
  try {
    const saved = localStorage.getItem(key);
    if (saved && isValid(saved)) value = saved;
  } catch {
    /* storage blocked */
  }
  const listeners = new Set<(v: T) => void>();

  return {
    get: () => value,
    set(next: T) {
      value = next;
      try {
        localStorage.setItem(key, next);
      } catch {
        /* storage blocked */
      }
      listeners.forEach((l) => l(next));
    },
    subscribe(listener: (v: T) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type Stored<T extends string> = ReturnType<typeof stored<T>>;

export function useStored<T extends string>(store: Stored<T>) {
  return useSyncExternalStore(store.subscribe, store.get);
}
