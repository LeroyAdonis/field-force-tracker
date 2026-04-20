import { useEffect, useState, useCallback } from "react";

/**
 * Returns a debounced version of the input value.
 * The debounced value only updates after `delayMs` milliseconds
 * of the input value remaining unchanged.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  const updateValue = useCallback(
    (v: T) => {
      setDebouncedValue(v);
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      updateValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs, updateValue]);

  return debouncedValue;
}
