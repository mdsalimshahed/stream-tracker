// src/hooks/useScaling.js
import { useMemo } from 'react';

export function useScaling(systemFonts, layoutPrefs) {
  // Dynamic scaling is disabled so text size is preserved on mobile.
  const scaledSystemFonts = useMemo(() => ({ ...systemFonts }), [systemFonts]);
  
  // Added enableViewTransitions to preferences
  const scaledLayoutPrefs = useMemo(() => ({ 
    ...layoutPrefs,
    enableViewTransitions: layoutPrefs.enableViewTransitions ?? true 
  }), [layoutPrefs]);

  return { scaledSystemFonts, scaledLayoutPrefs };
}