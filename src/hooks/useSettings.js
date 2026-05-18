// src/hooks/useSettings.js
import { useState, useEffect } from 'react';
import {
  DEFAULT_THUMBNAIL_CONFIG,
  DEFAULT_SYSTEM_FONTS,
  DEFAULT_LAYOUT_PREFS,
  DEFAULT_MODAL_BG_INTENSITY,
  DEFAULT_MODAL_PANEL_OPACITY,
} from '../utils/constants';

const checkPersist = () => {
  try { return localStorage.getItem('persistSettings') !== 'false'; } catch (e) { return true; }
};

export function useSettings() {
  const [persistSettings, setPersistSettings] = useState(checkPersist);

  const [thumbnailConfig, setThumbnailConfig] = useState(() => {
    if (!checkPersist()) return DEFAULT_THUMBNAIL_CONFIG;
    try {
      const s = localStorage.getItem('thumbnailConfig');
      if (s) {
        if (s === JSON.stringify(DEFAULT_THUMBNAIL_CONFIG)) return DEFAULT_THUMBNAIL_CONFIG;
        const p = JSON.parse(s);
        return {
          ...DEFAULT_THUMBNAIL_CONFIG, ...p,
          manualColors: { ...DEFAULT_THUMBNAIL_CONFIG.manualColors, ...(p.manualColors || {}) },
          colors: { ...DEFAULT_THUMBNAIL_CONFIG.colors, ...(p.colors || {}) },
        };
      }
    } catch (e) {}
    return DEFAULT_THUMBNAIL_CONFIG;
  });

  const [systemFonts, setSystemFonts] = useState(() => {
    if (!checkPersist()) return DEFAULT_SYSTEM_FONTS;
    try { 
      const s = localStorage.getItem('systemFonts'); 
      if (s === JSON.stringify(DEFAULT_SYSTEM_FONTS)) return DEFAULT_SYSTEM_FONTS;
      return s ? { ...DEFAULT_SYSTEM_FONTS, ...JSON.parse(s) } : DEFAULT_SYSTEM_FONTS; 
    } catch (e) { return DEFAULT_SYSTEM_FONTS; }
  });

  const [layoutPrefs, setLayoutPrefs] = useState(() => {
    if (!checkPersist()) return DEFAULT_LAYOUT_PREFS;
    try { 
      const s = localStorage.getItem('layoutPrefs'); 
      if (s === JSON.stringify(DEFAULT_LAYOUT_PREFS)) return DEFAULT_LAYOUT_PREFS;
      return s ? { ...DEFAULT_LAYOUT_PREFS, ...JSON.parse(s) } : DEFAULT_LAYOUT_PREFS; 
    } catch (e) { return DEFAULT_LAYOUT_PREFS; }
  });

  const [modalBgIntensity, setModalBgIntensity] = useState(() => {
    if (!checkPersist()) return DEFAULT_MODAL_BG_INTENSITY;
    try { const s = localStorage.getItem('modalBgIntensity'); return s !== null ? parseFloat(s) : DEFAULT_MODAL_BG_INTENSITY; } catch (e) { return DEFAULT_MODAL_BG_INTENSITY; }
  });

  const [modalPanelOpacity, setModalPanelOpacity] = useState(() => {
    if (!checkPersist()) return DEFAULT_MODAL_PANEL_OPACITY;
    try { const s = localStorage.getItem('modalPanelOpacity'); return s !== null ? parseFloat(s) : DEFAULT_MODAL_PANEL_OPACITY; } catch (e) { return DEFAULT_MODAL_PANEL_OPACITY; }
  });

  // Persistence effects
  useEffect(() => { localStorage.setItem('persistSettings', persistSettings); }, [persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('thumbnailConfig', JSON.stringify(thumbnailConfig)); else localStorage.removeItem('thumbnailConfig'); }, [thumbnailConfig, persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('systemFonts', JSON.stringify(systemFonts)); else localStorage.removeItem('systemFonts'); }, [systemFonts, persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('layoutPrefs', JSON.stringify(layoutPrefs)); else localStorage.removeItem('layoutPrefs'); }, [layoutPrefs, persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('modalBgIntensity', modalBgIntensity); else localStorage.removeItem('modalBgIntensity'); }, [modalBgIntensity, persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('modalPanelOpacity', modalPanelOpacity); else localStorage.removeItem('modalPanelOpacity'); }, [modalPanelOpacity, persistSettings]);

  const resetSettings = () => {
    setThumbnailConfig(DEFAULT_THUMBNAIL_CONFIG);
    setSystemFonts(DEFAULT_SYSTEM_FONTS);
    setLayoutPrefs(DEFAULT_LAYOUT_PREFS);
    setModalBgIntensity(DEFAULT_MODAL_BG_INTENSITY);
    setModalPanelOpacity(DEFAULT_MODAL_PANEL_OPACITY);
    
    // Clear the stored API keys
    localStorage.removeItem('youtubeApiKey');
    localStorage.removeItem('rawgApiKey');
  };

  const hasCustomSettings =
    JSON.stringify(systemFonts) !== JSON.stringify(DEFAULT_SYSTEM_FONTS) ||
    JSON.stringify(layoutPrefs) !== JSON.stringify(DEFAULT_LAYOUT_PREFS) ||
    JSON.stringify(thumbnailConfig) !== JSON.stringify(DEFAULT_THUMBNAIL_CONFIG);

  return {
    persistSettings, setPersistSettings,
    thumbnailConfig, setThumbnailConfig,
    systemFonts, setSystemFonts,
    layoutPrefs, setLayoutPrefs,
    modalBgIntensity, setModalBgIntensity,
    modalPanelOpacity, setModalPanelOpacity,
    resetSettings,
    hasCustomSettings,
  };
}