// src/utils/constants.js
export const RAWG_API_KEY = "9fba73b06e6549dab7044ebd9b630b0f";

export const DEFAULT_SYSTEM_FONTS = {
  libTitle: 16,
  libYear: 14,
  libBadge: 18,
  dashboardTime: 10, // Added for history timestamp
  modalHeader: 31,
  logTitle: 16,
  logSub: 13,
  searchBar: 19
};

export const DEFAULT_LAYOUT_PREFS = {
  cardPadding: 0,
  cardGap: 19,
  cardRadius: 32,
  cardMaxWidth: 461,
  cardsPerRow: 4,
  modalSplitRatio: 0.45,
  containerPaddingX: 77,
  containerPaddingY: 70,
  cardRounded: false,
  panelFillOpacity: 0.2,
  bgDimming: 0,
  cycleInterval: 3000,
  statsLeftWidth: 5,
  statsRightWidth: 5,
  statsCardPadding: 25,
  cardOpacity: 0.2,
  bgCycleInterval: 2,
  statsCardRadius: 10
};

export const DEFAULT_THUMBNAIL_CONFIG = {
  titleSize: 93,
  subtitleSize: 66,
  titleAlign: "center",
  titleYOffset: 10,
  titleSpacing: 25,
  strokeWidth: 13,
  splitTitle: true,
  streamCountSize: 88,
  cycleSize: 55,
  bottomSpacing: 81,
  bottomAlign: "left",
  bottomPaddingX: 51,
  bottomPaddingY: 62,
  showBottomShadow: true,
  forceInvertTitle: false,
  manualColors: {
    title: false,
    cycle: false,
    streamCount: false,
    subtitle: false,
    stream: false
  },
  colors: {
    titleFill: "rgba(255, 255, 255, 0.45)",
    titleStroke: "rgba(0, 0, 0, 0.74)",
    cycleFill: "rgba(255, 215, 0, 1)",
    cycleStroke: "rgba(0, 0, 0, 1)",
    streamFill: "rgba(0, 204, 255, 0.76)",
    streamStroke: "rgba(0, 0, 0, 1)",
    subtitleFill: "rgba(255, 255, 255, 0.59)",
    subtitleStroke: "rgba(0, 0, 0, 0.9)"
  },
  title: {
    size: 89,
    letterSpacing: 2,
    dropShadow: true,
    outlineWidth: 20,
    xPadding: 60,
    yPadding: 100,
    align: "center",
    fillOpacity: 1,
    strokeOpacity: 0.31
  },
  subtitle: {
    size: 71,
    letterSpacing: 2,
    dropShadow: true,
    outlineWidth: 20,
    xPadding: 60,
    yPadding: 40,
    align: "center"
  },
  cycle: {
    size: 55,
    letterSpacing: 2,
    dropShadow: true,
    outlineWidth: 4,
    xPadding: 60,
    yPadding: 80,
    align: "left",
    fillOpacity: 1,
    strokeOpacity: 0.78
  },
  stream: {
    size: 95,
    letterSpacing: 2,
    dropShadow: true,
    outlineWidth: 6,
    xPadding: 60,
    yPadding: 60,
    align: "left",
    fillOpacity: 1,
    strokeOpacity: 0.78
  },
  titleLetterSpacing: 0,
  subtitleLetterSpacing: 2,
  titleDropShadow: false,
  subtitleDropShadow: true,
  titleYPadding: 88,
  subtitleYPadding: 24,
  subtitleAlign: "right",
  cycleLetterSpacing: 2,
  cycleDropShadow: true,
  cycleYPadding: 150,
  cycleAlign: "left",
  streamCountLetterSpacing: 2,
  streamCountDropShadow: true,
  streamCountYPadding: 10,
  streamCountAlign: "left"
};

export const DEFAULT_MODAL_BG_INTENSITY = 1;
export const DEFAULT_MODAL_PANEL_OPACITY = 0.5;