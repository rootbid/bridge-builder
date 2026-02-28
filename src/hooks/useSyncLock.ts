import { useState, useEffect, useRef } from 'react';

export const useSyncLock = (onUnlock: () => void, requiredHoldTimeMs = 5000) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHolding) {
      const startTime = Date.now();
      
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / requiredHoldTimeMs) * 100, 100);
        setProgress(currentProgress);
        
        // Simulate escalating haptics
        if (navigator.vibrate) {
          if (currentProgress > 80) navigator.vibrate(50);
          else if (currentProgress > 50) navigator.vibrate(20);
        }
      }, 100);

      holdTimerRef.current = setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Success pattern
        onUnlock();
        setIsHolding(false);
        setProgress(0);
      }, requiredHoldTimeMs);
    } else {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(0);
    }

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isHolding, onUnlock, requiredHoldTimeMs]);

  const startHold = () => setIsHolding(true);
  const stopHold = () => setIsHolding(false);

  return { isHolding, progress, startHold, stopHold };
};
