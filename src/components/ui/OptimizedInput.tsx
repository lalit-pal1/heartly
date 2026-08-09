'use client';

import React, { useState, useEffect, useRef } from 'react';

// Custom lightweight hook for debouncing callbacks
function useDebouncedCallback<A extends any[]>(
  callback: (...args: A) => void,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFunc = useRef((...args: A) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  });

  // Keep callback updated to avoid closure capture issues
  useEffect(() => {
    debouncedFunc.current = (...args: A) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  }, [callback, delay]);

  return (...args: A) => debouncedFunc.current(...args);
}

interface OptimizedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (val: string) => void;
  debounceMs?: number;
}

export const OptimizedInput = React.forwardRef<HTMLInputElement, OptimizedInputProps>(
  ({ value, onValueChange, debounceMs = 150, ...props }, ref) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync state if value is modified externally (e.g. AI draft, template change)
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const debouncedPropagate = useDebouncedCallback((val: string) => {
      onValueChange(val);
    }, debounceMs);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      debouncedPropagate(val);
    };

    return (
      <input
        ref={ref}
        {...props}
        value={localValue}
        onChange={handleChange}
        onBlur={() => {
          // Sync instantly on blur to guarantee parent state has correct final input value
          onValueChange(localValue);
        }}
      />
    );
  }
);
OptimizedInput.displayName = 'OptimizedInput';

interface OptimizedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (val: string) => void;
  debounceMs?: number;
  maxChars?: number;
}

export const OptimizedTextarea = React.forwardRef<HTMLTextAreaElement, OptimizedTextareaProps>(
  ({ value, onValueChange, debounceMs = 150, maxChars, ...props }, ref) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync state if value is modified externally
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const debouncedPropagate = useDebouncedCallback((val: string) => {
      onValueChange(val);
    }, debounceMs);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (maxChars && val.length > maxChars) return;
      setLocalValue(val);
      debouncedPropagate(val);
    };

    return (
      <textarea
        ref={ref}
        {...props}
        value={localValue}
        onChange={handleChange}
        onBlur={() => {
          // Sync instantly on blur to guarantee parent state has correct final input value
          onValueChange(localValue);
        }}
      />
    );
  }
);
OptimizedTextarea.displayName = 'OptimizedTextarea';
