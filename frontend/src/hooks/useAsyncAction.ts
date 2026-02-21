import { useCallback, useState } from 'react';
import { useLoadingContext } from '@/context/loading-context';

interface UseAsyncActionReturn {
  /**
   * Wrap any async function with this.
   * It automatically tracks the global + local loading state and
   * ensures the counter is always decremented even on errors.
   *
   * @example
   * const { run, isLoading } = useAsyncAction();
   * run(() => submitForm(data));
   */
  run: (fn: () => Promise<void>) => Promise<void>;
  /** True while this specific `run` call is in-flight. */
  isLoading: boolean;
}

/**
 * A hook that:
 * 1. Increments the **global** loading counter (drives the top progress bar).
 * 2. Exposes a local `isLoading` boolean so the calling component can disable
 *    buttons / show spinners as before.
 * 3. Guarantees the counter is always decremented via `finally`.
 */
export function useAsyncAction(): UseAsyncActionReturn {
  const { _increment, _decrement } = useLoadingContext();
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setIsLoading(true);
      _increment();
      try {
        await fn();
      } finally {
        setIsLoading(false);
        _decrement();
      }
    },
    [_increment, _decrement],
  );

  return { run, isLoading };
}
