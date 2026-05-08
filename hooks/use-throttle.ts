'use client';

import { useState, useEffect, useRef } from "react"

export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRanRef = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()
    if (now >= lastRanRef.current + delay) {
      lastRanRef.current = now
      setThrottledValue(value)
    } else {
      const handler = setTimeout(() => {
        lastRanRef.current = Date.now()
        setThrottledValue(value)
      }, delay - (now - lastRanRef.current))

      return () => clearTimeout(handler)
    }
  }, [value, delay])

  return throttledValue
}
