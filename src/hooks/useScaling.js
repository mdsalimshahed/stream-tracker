// src/hooks/useScaling.js
import { useState, useEffect, useMemo } from 'react';

export function useScaling(systemFonts, layoutPrefs) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => { clearTimeout(timeoutId); timeoutId = setTimeout(() => setWindowWidth(window.innerWidth), 100); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); clearTimeout(timeoutId); };
  }, []);

  const scaleFactor = Math.max(0.45, windowWidth / 1920);

  const scaledSystemFonts = useMemo(() => {
    const scaled = { ...systemFonts };
    ['libTitle', 'libYear', 'dashboardTime', 'modalHeader', 'logTitle', 'logSub', 'searchBar'].forEach(key => {
      if (typeof scaled[key] === 'number') scaled[key] = Math.max(1, scaled[key] * scaleFactor);
    });
    return scaled;
  }, [systemFonts, scaleFactor]);

  const scaledLayoutPrefs = useMemo(() => {
    const scaled = { ...layoutPrefs };
    ['cardPadding', 'cardGap', 'cardMaxWidth', 'containerPaddingX', 'containerPaddingY', 'cardRadius'].forEach(key => {
      if (typeof scaled[key] === 'number') scaled[key] = Math.max(0, scaled[key] * scaleFactor);
    });
    return scaled;
  }, [layoutPrefs, scaleFactor]);

  return { scaledSystemFonts, scaledLayoutPrefs };
}