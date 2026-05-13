// src/components/stats/hooks.js
import { useState, useEffect } from 'react';

export const useDynamicTime = (timestampMs) => {
  const [timeText, setTimeText] = useState('');
  useEffect(() => {
    if (!timestampMs) { setTimeText('Never'); return; }
    let interval;
    const update = () => {
      const now = Date.now();
      const diffSec = Math.floor((now - timestampMs) / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffSec < 60) setTimeText(`${diffSec} second${diffSec !== 1 ? 's' : ''} ago`);
      else if (diffMin < 60) setTimeText(`${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`);
      else if (diffHour < 24) setTimeText(`${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`);
      else setTimeText(`${diffDay} day${diffDay !== 1 ? 's' : ''} ago`);
    };
    
    update();
    
    const d = Math.floor((Date.now() - timestampMs) / 1000);
    if (d < 60) interval = setInterval(update, 1000);
    else if (d < 3600) interval = setInterval(update, 60000);
    else interval = setInterval(update, 3600000);
    
    return () => clearInterval(interval);
  }, [timestampMs]);
  return timeText;
};

export const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === undefined || target === 0) { setCount(0); return; }
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};
