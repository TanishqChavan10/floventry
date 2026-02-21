'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface LoadingContextValue {
  /** True when at least one async action is in-flight. */
  isLoading: boolean;
  /** Internal – increment the in-flight counter. */
  _increment: () => void;
  /** Internal – decrement the in-flight counter (clamped to 0). */
  _decrement: () => void;
}

const LoadingContext = createContext<LoadingContextValue>({
  isLoading: false,
  _increment: () => {},
  _decrement: () => {},
});

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const _increment = useCallback(() => setCount((c) => c + 1), []);
  const _decrement = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  const value = useMemo<LoadingContextValue>(
    () => ({ isLoading: count > 0, _increment, _decrement }),
    [count, _increment, _decrement],
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

/** Returns the global loading state. */
export function useLoadingContext(): LoadingContextValue {
  return useContext(LoadingContext);
}
