export const RAWG_API_KEY = "9fba73b06e6549dab7044ebd9b630b0f";

export const DEFAULT_SYSTEM_FONTS = {
  libTitle: 22,
  libYear: 14,
  libBadge: 10,
  modalHeader: 36,
  logTitle: 18,
  logSub: 12,
  searchBar: 20
};

export const DEFAULT_LAYOUT_PREFS = {
  cardPadding: 16,
  cardGap: 16,
  cardRadius: 12,
  cardMaxWidth: 320,
  cardsPerRow: 5,        // Default cards in a row for large screens
  modalSplitRatio: 0.6,  // 60% left, 40% right for the modal
  containerPaddingX: 40,
  containerPaddingY: 32,
  cardRounded: true,
  panelFillOpacity: 0.2, 
  bgDimming: 0.6,        
  cycleInterval: 4000    
};

export const DEFAULT_THUMBNAIL_CONFIG = {
  titleSize: 110,
  subtitleSize: 80,
  titleAlign: 'center',
  titleYOffset: 40,
  titleSpacing: 24,
  strokeWidth: 8,
  splitTitle: true,
  streamCountSize: 95,
  cycleSize: 55,
  bottomSpacing: 20,
  bottomAlign: 'left',
  bottomPaddingX: 50,
  bottomPaddingY: 50,
  showBottomShadow: true,
  forceInvertTitle: false,
  manualColors: { title: false, cycle: false, streamCount: false },
  colors: {
    titleFill: 'rgba(255, 255, 255, 0.59)',
    titleStroke: 'rgba(0, 0, 0, 0.9)',
    cycleFill: 'rgba(255, 215, 0, 1)',
    cycleStroke: 'rgba(0, 0, 0, 0.78)',
    streamFill: 'rgba(255, 255, 255, 1)',
    streamStroke: 'rgba(0, 0, 0, 0.78)'
  }
};

export const DEFAULT_MODAL_BG_INTENSITY = 0.5;
export const DEFAULT_MODAL_PANEL_OPACITY = 0.85;