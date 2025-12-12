import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * Useful for search inputs and API calls that should not fire on every keystroke
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 400ms)
 * @returns Debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 400): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up the timeout
        const timeoutId = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timeout if value changes before delay expires
        return () => {
            clearTimeout(timeoutId);
        };
    }, [value, delay]);

    return debouncedValue;
}
