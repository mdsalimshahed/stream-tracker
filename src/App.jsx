// src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Loader2, Plus, X } from 'lucide-react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import DataManager from './components/DataManager';
import GameProfileModal from './components/GameProfileModal';
import LivestreamSetupWorkspace from './components/LivestreamSetupWorkspace';
import Stats from './components/Stats';
import { Notification } from './components/Notification';
import { CrossfadeImage } from './components/common/UIComponents';
import { RAWG_API_KEY, DEFAULT_SYSTEM_FONTS, DEFAULT_LAYOUT_PREFS, DEFAULT_THUMBNAIL_CONFIG, DEFAULT_MODAL_BG_INTENSITY, DEFAULT_MODAL_PANEL_OPACITY } from './utils/constants';
import { formatRunName, formatReleaseDate } from './utils/helpers';

// --- Two-Level Randomization Helpers ---
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const generateGlobalPlaylist = (gamesObj, lastGameId = null) => {
  let pool = [];
  Object.entries(gamesObj).forEach(([id, game]) => {
    const uniqueThumbs = [...new Set((game.thumbnail_urls || []).filter(Boolean))];
    uniqueThumbs.forEach(url => {
      pool.push({ url, gameId: id });
    });
  });

  if (pool.length === 0) return [];
  if (pool.length === 1) return pool;

  let shuffled = shuffleArray(pool);
  let playlist = [];
  let currentGameId = lastGameId;

  while (shuffled.length > 0) {
    let foundIdx = 0;
    if (currentGameId !== null) {
      while (foundIdx < shuffled.length && shuffled[foundIdx].gameId === currentGameId) {
        foundIdx++;
      }
      if (foundIdx === shuffled.length) {
        foundIdx = 0;
      }
    }
    const selected = shuffled[foundIdx];
    playlist.push(selected);
    currentGameId = selected.gameId;
    shuffled.splice(foundIdx, 1);
  }

  return playlist;
};

const generateSingleGamePlaylist = (images, lastImageUrl = null) => {
  const uniqueThumbs = [...new Set(images.filter(Boolean))];
  if (uniqueThumbs.length === 0) return [];
  if (uniqueThumbs.length === 1) return uniqueThumbs;

  let shuffled = shuffleArray(uniqueThumbs);
  if (lastImageUrl && shuffled[0] === lastImageUrl) {
    const temp = shuffled[0];
    shuffled[0] = shuffled[1];
    shuffled[1] = temp;
  }
  return shuffled;
};

// --- Mosaic Component (Hardware Accelerated Transparent 3D Window Flip) ---
const MosaicBackground = React.memo(({ mosaicImages, isPaused, isSlowMode, shouldFlip, activeHoverUrl }) => {
  const ROWS = 7;
  const IMGS_PER_ROW = 24;

  const rowRefs = useRef([]);
  const requestRef = useRef(null);

  const globalStateRef = useRef({ currentSpeed: isSlowMode ? 0.15 : 1 });
  const modeRef = useRef({ isPaused, isSlowMode });
  
  const [flipUrl, setFlipUrl] = useState(null);

  useEffect(() => {
    modeRef.current = { isPaused, isSlowMode };
  }, [isPaused, isSlowMode]);

  useEffect(() => {
    if (activeHoverUrl) {
      setFlipUrl(activeHoverUrl);
    }
  }, [activeHoverUrl]);

  const rowsConfig = useMemo(() => {
    const fallback = { url: 'https://placehold.co/110x110/0d1117/1e2938?text=', gameId: 'fallback' };
    const pool = mosaicImages && mosaicImages.length > 0 ? mosaicImages : [fallback];
    const aspectRatios = ['16/9', '4/3', '1/1'];

    return Array.from({ length: ROWS }, (_, i) => {
      let sequence = [];
      let lastGameId = null;
      
      while (sequence.length < IMGS_PER_ROW) {
        let shuffled = [...pool].sort(() => Math.random() - 0.5);
        let batch = [];
        
        while (shuffled.length > 0) {
          let foundIdx = 0;
          if (lastGameId !== null) {
            while (foundIdx < shuffled.length && shuffled[foundIdx].gameId === lastGameId) {
              foundIdx++;
            }
            if (foundIdx === shuffled.length) foundIdx = 0;
          }
          const selected = shuffled[foundIdx];
          batch.push(selected);
          lastGameId = selected.gameId;
          shuffled.splice(foundIdx, 1);
        }
        sequence.push(...batch);
      }
      
      let base = sequence.slice(0, IMGS_PER_ROW);

      if (base.length > 2 && base[base.length - 1].gameId === base[0].gameId) {
        for (let k = base.length - 2; k >= 1; k--) {
          if (
            base[k].gameId !== base[0].gameId && 
            base[k].gameId !== base[base.length - 2].gameId &&
            base[base.length - 1].gameId !== base[k - 1].gameId &&
            base[base.length - 1].gameId !== base[k + 1].gameId
          ) {
            const temp = base[k];
            base[k] = base[base.length - 1];
            base[base.length - 1] = temp;
            break;
          }
        }
      }

      const baseWithAspect = base.map(b => ({
        url: b.url,
        aspect: aspectRatios[Math.floor(Math.random() * aspectRatios.length)]
      }));

      const duration = 40000 + Math.random() * 20000; 
      const direction = i % 2 === 0 ? 'left' : 'right';
      const baseSpeed = 50 / duration;

      return {
        imgs: [...baseWithAspect, ...baseWithAspect],
        baseSpeed,
        direction,
        state: { targetChaos: 1, currentChaos: 1, timer: 0 }
      };
    });
  }, [mosaicImages]);

  useEffect(() => {
    let lastTime = performance.now();
    let positions = rowsConfig.map(c => c.direction === 'right' ? -50 : 0);

    const animateLoop = (time) => {
      const delta = time - lastTime;
      lastTime = time;
      const safeDelta = Math.min(delta, 50);

      const globalLerpFactor = 1 - Math.exp(-safeDelta * 0.0015);
      const chaosLerpFactor = 1 - Math.exp(-safeDelta * 0.0008);

      let targetGlobalSpeed = 1.0;
      if (modeRef.current.isPaused) targetGlobalSpeed = 0.0;
      else if (modeRef.current.isSlowMode) targetGlobalSpeed = 0.15;

      globalStateRef.current.currentSpeed += (targetGlobalSpeed - globalStateRef.current.currentSpeed) * globalLerpFactor;

      if (Math.abs(globalStateRef.current.currentSpeed) < 0.001 && targetGlobalSpeed === 0) {
        globalStateRef.current.currentSpeed = 0;
      }

      rowsConfig.forEach((config, i) => {
        const state = config.state;
        state.timer -= safeDelta;

        if (state.timer <= 0) {
          const rand = Math.random();
          if (rand < 0.15) { 
            state.targetChaos = 0.1 + Math.random() * 0.2;
            state.timer = 2000 + Math.random() * 3000;
          } else if (rand < 0.35) { 
            state.targetChaos = 1.5 + Math.random() * 1.5;
            state.timer = 2500 + Math.random() * 3500;
          } else { 
            state.targetChaos = 0.8 + Math.random() * 0.4;
            state.timer = 3000 + Math.random() * 5000;
          }
        }

        state.currentChaos += (state.targetChaos - state.currentChaos) * chaosLerpFactor;

        const actualSpeed = globalStateRef.current.currentSpeed * state.currentChaos * config.baseSpeed;
        const moveAmount = actualSpeed * safeDelta;

        if (config.direction === 'left') {
          positions[i] -= moveAmount;
          if (positions[i] <= -50) positions[i] += 50;
        } else {
          positions[i] += moveAmount;
          if (positions[i] >= 0) positions[i] -= 50;
        }

        const el = rowRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${positions[i]}%, 0, 0)`;
        }
      });

      requestRef.current = requestAnimationFrame(animateLoop);
    };

    requestRef.current = requestAnimationFrame(animateLoop);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [rowsConfig]); 

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="flex flex-col h-[100vh] w-full">
        {rowsConfig.map((row, ri) => (
          <div 
            key={ri} 
            className="flex-none flex flex-row items-stretch will-change-transform" 
            style={{ width: 'max-content', height: `${100 / ROWS}vh` }}
            ref={el => rowRefs.current[ri] = el}
          >
            {row.imgs.map((item, ii) => (
              <div 
                key={ii} 
                className="shrink-0 h-full perspective-1000" 
                style={{ aspectRatio: item.aspect }}
              >
                <div 
                  className={`relative w-full h-full transition-transform duration-[1200ms] ${shouldFlip ? 'rotate-y-180' : ''}`}
                  style={{ 
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
                    transitionDelay: `${(ri * 40) + ((ii % IMGS_PER_ROW) * 20)}ms`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Front Face */}
                  <div className="absolute inset-0 bg-black" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                    <img src={item.url} alt="" className="w-full h-full object-cover block" loading="lazy" decoding="async" />
                  </div>
                  {/* Back Face (Transparent Window) */}
                  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'transparent' }}></div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
// ---------------------------------------

const migrateLabels = (data) => {
  let changed = false;
  const newData = JSON.parse(JSON.stringify(data));
  for (const [gameId, game] of Object.entries(newData)) {
    if (game.label && game.cycles) {
      const firstRunKey = game.cycles['main'] ? 'main' : Object.keys(game.cycles)[0];
      if (firstRunKey && game.cycles[firstRunKey]) {
        game.cycles[firstRunKey].label = game.label;
        changed = true;
      }
      delete game.label;
    }
  }
  return { data: newData, changed };
};

const checkPersist = () => {
  try { return localStorage.getItem('persistSettings') !== 'false'; } catch(e) { return true; }
};

export default function App() {
  const [persistSettings, setPersistSettings] = useState(checkPersist);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (msg, type) => setToast({ message: msg, type });

  const [streamData, setStreamData] = useState(() => {
    try {
      const s = localStorage.getItem('streamManagerData');
      if (s) {
        const parsed = JSON.parse(s);
        const { data, changed } = migrateLabels(parsed);
        if (changed) return data;
        return parsed;
      }
    } catch (e) {}
    return {};
  });

  const [thumbnailConfig, setThumbnailConfig] = useState(() => {
    if (!checkPersist()) return DEFAULT_THUMBNAIL_CONFIG;
    try {
      const s = localStorage.getItem('thumbnailConfig');
      if (s) {
        const p = JSON.parse(s);
        return {
          ...DEFAULT_THUMBNAIL_CONFIG,
          ...p,
          manualColors: { ...DEFAULT_THUMBNAIL_CONFIG.manualColors, ...(p.manualColors || {}) },
          colors: { ...DEFAULT_THUMBNAIL_CONFIG.colors, ...(p.colors || {}) }
        };
      }
    } catch (e) {}
    return DEFAULT_THUMBNAIL_CONFIG;
  });

  const [systemFonts, setSystemFonts] = useState(() => {
    if (!checkPersist()) return DEFAULT_SYSTEM_FONTS;
    try {
      const s = localStorage.getItem('systemFonts');
      return s ? JSON.parse(s) : DEFAULT_SYSTEM_FONTS;
    } catch(e) { return DEFAULT_SYSTEM_FONTS; }
  });

  const [layoutPrefs, setLayoutPrefs] = useState(() => {
    if (!checkPersist()) return { ...DEFAULT_LAYOUT_PREFS, enableHoverEffects: true };
    try {
      const s = localStorage.getItem('layoutPrefs');
      return s ? { enableHoverEffects: true, ...DEFAULT_LAYOUT_PREFS, ...JSON.parse(s) } : { ...DEFAULT_LAYOUT_PREFS, enableHoverEffects: true };
    } catch(e) { return { ...DEFAULT_LAYOUT_PREFS, enableHoverEffects: true }; }
  });

  const [modalBgIntensity, setModalBgIntensity] = useState(() => {
    if (!checkPersist()) return DEFAULT_MODAL_BG_INTENSITY;
    try {
      const s = localStorage.getItem('modalBgIntensity');
      return s !== null ? parseFloat(s) : DEFAULT_MODAL_BG_INTENSITY;
    } catch(e) { return DEFAULT_MODAL_BG_INTENSITY; }
  });

  const [modalPanelOpacity, setModalPanelOpacity] = useState(() => {
    if (!checkPersist()) return DEFAULT_MODAL_PANEL_OPACITY;
    try {
      const s = localStorage.getItem('modalPanelOpacity');
      return s !== null ? parseFloat(s) : DEFAULT_MODAL_PANEL_OPACITY;
    } catch(e) { return DEFAULT_MODAL_PANEL_OPACITY; }
  });

  const [currentView, setCurrentView] = useState(() => {
    try {
      const s = localStorage.getItem('streamManagerData');
      if (s && Object.keys(JSON.parse(s)).length > 0) return 'dashboard';
    } catch(e) {}
    return 'data';
  });
  
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [initialRunForModal, setInitialRunForModal] = useState(null);
  const [wCf, setWCF] = useState(null);
  const [sQ, setSQ] = useState('');
  const [sR, setSR] = useState([]);
  const [isS, setIsS] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const mosaicImages = useMemo(() => Object.entries(streamData).flatMap(([id, g]) => 
    (g.thumbnail_urls || []).filter(Boolean).map(url => ({ url, gameId: id }))
  ), [streamData]);

  const hoverPlaylistRef = useRef({ gameId: null, list: [], index: -1 });
  
  const [activeBgUrl, setActiveBgUrl] = useState('');
  const [hoverState, setHoverState] = useState({ cardId: null, gameId: null });
  const hoverTimeoutRef = useRef(null);
  const clearHoverTimeoutRef = useRef(null);
  const [mosaicPaused, setMosaicPaused] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setWindowWidth(window.innerWidth), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const scaleFactor = Math.max(0.45, windowWidth / 1920);

  const scaledSystemFonts = useMemo(() => {
    const scaled = { ...systemFonts };
    const scalableFontKeys = ['libTitle', 'libYear', 'dashboardTime', 'modalHeader', 'logTitle', 'logSub', 'searchBar'];
    scalableFontKeys.forEach(key => {
      if (typeof scaled[key] === 'number') {
        scaled[key] = Math.max(1, scaled[key] * scaleFactor);
      }
    });
    return scaled;
  }, [systemFonts, scaleFactor]);

  const scaledLayoutPrefs = useMemo(() => {
    const scaled = { ...layoutPrefs };
    const scalableLayoutKeys = ['cardPadding', 'cardGap', 'cardMaxWidth', 'containerPaddingX', 'containerPaddingY', 'cardRadius'];
    scalableLayoutKeys.forEach(key => {
      if (typeof scaled[key] === 'number') {
        scaled[key] = Math.max(0, scaled[key] * scaleFactor);
      }
    });
    return scaled;
  }, [layoutPrefs, scaleFactor]);

  const hasCustomSettings = 
    JSON.stringify(systemFonts) !== JSON.stringify(DEFAULT_SYSTEM_FONTS) || 
    JSON.stringify(layoutPrefs) !== JSON.stringify(DEFAULT_LAYOUT_PREFS) ||
    JSON.stringify(thumbnailConfig) !== JSON.stringify(DEFAULT_THUMBNAIL_CONFIG);

  useEffect(() => { localStorage.setItem('streamManagerData', JSON.stringify(streamData)); }, [streamData]);
  useEffect(() => { localStorage.setItem('persistSettings', persistSettings); }, [persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('thumbnailConfig', JSON.stringify(thumbnailConfig)); else localStorage.removeItem('thumbnailConfig'); }, [thumbnailConfig, persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('systemFonts', JSON.stringify(systemFonts)); else localStorage.removeItem('systemFonts'); }, [systemFonts, persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('layoutPrefs', JSON.stringify(layoutPrefs)); else localStorage.removeItem('layoutPrefs'); }, [layoutPrefs, persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('modalBgIntensity', modalBgIntensity); else localStorage.removeItem('modalBgIntensity'); }, [modalBgIntensity, persistSettings]);
  useEffect(() => { if (persistSettings) localStorage.setItem('modalPanelOpacity', modalPanelOpacity); else localStorage.removeItem('modalPanelOpacity'); }, [modalPanelOpacity, persistSettings]);


  // Global click listener: if hovers are disabled and you click OUTSIDE a card, it resets the background
  useEffect(() => {
    const handleGlobalClick = () => {
      if (layoutPrefs.enableHoverEffects === false && hoverState.gameId) {
        setHoverState({ cardId: null, gameId: null });
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [layoutPrefs.enableHoverEffects, hoverState.gameId]);

  // Handle direct clicks on the card
  const handleCardClick = (e, uniqueCardId, gameId, cycleId = null) => {
    e.stopPropagation(); // Prevents the global click listener above from firing
    
    if (layoutPrefs.enableHoverEffects !== false) {
      // Normal Behavior: Click opens the profile immediately
      setHoverState({ cardId: null, gameId: null });
      openGameProfile(gameId, cycleId);
    } else {
      // Disabled Hover Behavior: First click previews, Second click opens
      if (hoverState.cardId === uniqueCardId) {
        setHoverState({ cardId: null, gameId: null });
        openGameProfile(gameId, cycleId);
      } else {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        if (clearHoverTimeoutRef.current) clearTimeout(clearHoverTimeoutRef.current);
        setHoverState({ cardId: uniqueCardId, gameId });
      }
    }
  };

  const handleHoverGame = (cardId, gameId) => {
    if (layoutPrefs.enableHoverEffects === false) return; // Do nothing on physical hover if disabled

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (cardId === null) {
      if (!clearHoverTimeoutRef.current) {
        clearHoverTimeoutRef.current = setTimeout(() => {
          setHoverState({ cardId: null, gameId: null });
          clearHoverTimeoutRef.current = null;
        }, 1500);
      }
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        if (clearHoverTimeoutRef.current) {
          clearTimeout(clearHoverTimeoutRef.current);
          clearHoverTimeoutRef.current = null;
        }
        setHoverState({ cardId, gameId });
      }, 1500);
    }
  };

  useEffect(() => {
    if (selectedGameId || wCf) {
      setMosaicPaused(true);
      return;
    }
    if (hoverState.gameId) {
      setMosaicPaused(true);
    } else {
      setMosaicPaused(false);
    }
  }, [selectedGameId, wCf, hoverState.gameId]);

  useEffect(() => {
    const isPaused = selectedGameId || wCf; 
    if (isPaused) return;

    const gameId = hoverState.gameId;
    const isHovering = Boolean(gameId && streamData[gameId]);

    let intervalId;

    if (isHovering) {
      if (hoverPlaylistRef.current.gameId !== gameId) {
        const rawImages = streamData[gameId].thumbnail_urls || [];
        hoverPlaylistRef.current = {
          gameId,
          list: generateSingleGamePlaylist(rawImages),
          index: -1
        };
        
        const startingImage = streamData[gameId].cover_image || rawImages[0] || '';
        setActiveBgUrl(startingImage); 
      } else {
        const idx = hoverPlaylistRef.current.index;
        const currentImg = idx >= 0 ? hoverPlaylistRef.current.list[idx] : null;
        const fallback = streamData[gameId].cover_image || '';
        
        setActiveBgUrl(currentImg || fallback);
      }

      const hList = hoverPlaylistRef.current.list;
      if (hList.length > 0) {
        intervalId = setInterval(() => {
          let idx = hoverPlaylistRef.current.index + 1;
          
          if (idx >= hoverPlaylistRef.current.list.length) {
            const lastImg = hoverPlaylistRef.current.list[hoverPlaylistRef.current.list.length - 1];
            hoverPlaylistRef.current.list = generateSingleGamePlaylist(streamData[gameId].thumbnail_urls || [], lastImg);
            idx = 0;
          }
          
          hoverPlaylistRef.current.index = idx;
          setActiveBgUrl(hoverPlaylistRef.current.list[idx]);
        }, layoutPrefs.hoverCycleInterval || 1500); 
      }
    }

    return () => clearInterval(intervalId);
  }, [hoverState.gameId, streamData, selectedGameId, wCf, layoutPrefs.hoverCycleInterval]);

  // Handle data recovery and Steam Auto-Link on component load
  useEffect(() => {
    const recovery = async () => {
      const dataCopy = JSON.parse(JSON.stringify(streamData));
      let changed = false;
      
      for (const [id, game] of Object.entries(dataCopy)) {
        if (!game.details) game.details = { developer: 'Unknown', publisher: 'Unknown', releaseDate: game.release_year, genres: 'Unknown', tags: 'Unknown' };
        
        if (!game.cover_image) {
          if (game.thumbnail_urls && game.thumbnail_urls.length > 0) {
            game.cover_image = game.thumbnail_urls[0];
            game.thumbnail_urls = game.thumbnail_urls.filter(url => !url.includes('header.jpg') && !url.includes('capsule'));
          } else {
            game.cover_image = 'https://placehold.co/600x400/1e293b/475569?text=Cover';
          }
          changed = true;
        }
        
        let isUpdated = false;

        if (!game.details.steamUrl && !game.details.notOnSteam) {
          try {
             let steamId = null;
             if (/^\d+$/.test(id)) {
                steamId = id;
             } else {
                const cleanName = game.game_name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
                const searchRes = await fetch(`/steam-api/api/storesearch/?term=${encodeURIComponent(cleanName)}&l=english&cc=US`);
                const searchData = await searchRes.json();
                if (searchData.items && searchData.items.length > 0) {
                   steamId = searchData.items[0].id;
                }
             }

             if (steamId) {
                const detailRes = await fetch(`/steam-api/api/appdetails?appids=${steamId}&l=english`);
                const detailsRaw = await detailRes.json();
                const steamDataObj = detailsRaw[steamId]?.data;

                if (steamDataObj) {
                   game.cover_image = steamDataObj.header_image;
                   
                   let newUrls = [];
                   if (steamDataObj.screenshots) {
                     newUrls = steamDataObj.screenshots.map(s => s.path_full);
                   }
                   
                   newUrls = [...newUrls, ...(game.thumbnail_urls || [])];
                   game.thumbnail_urls = [...new Set(newUrls)].filter(Boolean);
                   
                   game.details.developer = steamDataObj.developers?.join(', ') || game.details.developer;
                   game.details.publisher = steamDataObj.publishers?.join(', ') || game.details.publisher;
                   game.details.releaseDate = steamDataObj.release_date?.date || game.details.releaseDate;
                   game.details.genres = steamDataObj.genres?.map(g => g.description).join(', ') || game.details.genres;
                   game.details.steamUrl = `https://store.steampowered.com/app/${steamId}/`;
                   
                   isUpdated = true;
                }
             }
             
             await new Promise(r => setTimeout(r, 400));
          } catch(e) {}
        }
        
        if (!game.thumbnail_urls || game.thumbnail_urls.length < 2) {
          try {
            const cleanName = game.game_name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
            const rawgSearchRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(cleanName)}&page_size=1`);
            const rawgSearchData = await rawgSearchRes.json();
            
            if (rawgSearchData.results && rawgSearchData.results[0]) {
              const rawgId = rawgSearchData.results[0].id;
              const sRes = await fetch(`https://api.rawg.io/api/games/${rawgId}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
              const sData = await sRes.json();
              if (sData.results) {
                let newUrls = [...(game.thumbnail_urls || []), ...sData.results.map(x => x.image)].filter(Boolean);
                game.thumbnail_urls = [...new Set(newUrls)];
                isUpdated = true;
              }
            }
          } catch(e) {}
        }

        if (isUpdated) changed = true;
      }
      
      if (changed) setStreamData(dataCopy);
    };
    
    if (Object.keys(streamData).length > 0) recovery();
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    notify('Starting manual library sync...', 'info');
    
    const dataCopy = JSON.parse(JSON.stringify(streamData));
    let changed = false;
    
    for (const [id, game] of Object.entries(dataCopy)) {
      if (!game.details) game.details = { developer: 'Unknown', publisher: 'Unknown', releaseDate: game.release_year, genres: 'Unknown', tags: 'Unknown' };
      
      if (!game.cover_image) {
        if (game.thumbnail_urls && game.thumbnail_urls.length > 0) {
          game.cover_image = game.thumbnail_urls[0];
          game.thumbnail_urls = game.thumbnail_urls.filter(url => !url.includes('header.jpg') && !url.includes('capsule'));
        } else {
          game.cover_image = 'https://placehold.co/600x400/1e293b/475569?text=Cover';
        }
        changed = true;
      }
      
      if (!game.details.steamUrl && !game.details.notOnSteam) {
        try {
           let steamId = null;
           if (/^\d+$/.test(id)) {
              steamId = id;
           } else {
              const cleanName = game.game_name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
              const searchRes = await fetch(`/steam-api/api/storesearch/?term=${encodeURIComponent(cleanName)}&l=english&cc=US`);
              const searchData = await searchRes.json();
              if (searchData.items && searchData.items.length > 0) {
                 steamId = searchData.items[0].id;
              }
           }

           if (steamId) {
              const detailRes = await fetch(`/steam-api/api/appdetails?appids=${steamId}&l=english`);
              const detailsRaw = await detailRes.json();
              const steamDataObj = detailsRaw[steamId]?.data;

              if (steamDataObj) {
                 game.cover_image = steamDataObj.header_image;
                 
                 let newUrls = [];
                 if (steamDataObj.screenshots) {
                   newUrls = steamDataObj.screenshots.map(s => s.path_full);
                 }
                 
                 newUrls = [...newUrls, ...(game.thumbnail_urls || [])];
                 game.thumbnail_urls = [...new Set(newUrls)].filter(Boolean);
                 
                 game.details.developer = steamDataObj.developers?.join(', ') || game.details.developer;
                 game.details.publisher = steamDataObj.publishers?.join(', ') || game.details.publisher;
                 game.details.releaseDate = steamDataObj.release_date?.date || game.details.releaseDate;
                 game.details.genres = steamDataObj.genres?.map(g => g.description).join(', ') || game.details.genres;
                 game.details.steamUrl = `https://store.steampowered.com/app/${steamId}/`;
                 
                 changed = true;
              }
           }
           await new Promise(r => setTimeout(r, 400));
        } catch(e) {}
      }
      
      if (!game.thumbnail_urls || game.thumbnail_urls.length < 2) {
        try {
          const cleanName = game.game_name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
          const rawgSearchRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(cleanName)}&page_size=1`);
          const rawgSearchData = await rawgSearchRes.json();
          
          if (rawgSearchData.results && rawgSearchData.results[0]) {
            const rawgId = rawgSearchData.results[0].id;
            const sRes = await fetch(`https://api.rawg.io/api/games/${rawgId}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
            const sData = await sRes.json();
            if (sData.results) {
              let newUrls = [...(game.thumbnail_urls || []), ...sData.results.map(x => x.image)].filter(Boolean);
              game.thumbnail_urls = [...new Set(newUrls)];
              changed = true;
            }
          }
        } catch(e) {}
      }
    }
    
    const steamDevs = new Set();
    const steamPubs = new Set();

    Object.values(dataCopy).forEach(g => {
      if (g.details && !g.details.notOnSteam && g.details.steamUrl) {
        if (g.details.developer && g.details.developer !== 'Unknown') steamDevs.add(g.details.developer);
        if (g.details.publisher && g.details.publisher !== 'Unknown') steamPubs.add(g.details.publisher);
      }
    });

    const isSimilar = (str1, str2) => {
      if (!str1 || !str2) return false;
      const c1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
      const c2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (c1.length < 4 || c2.length < 4) return false;
      return c1.includes(c2) || c2.includes(c1);
    };

    Object.values(dataCopy).forEach(g => {
      if (g.details && g.details.notOnSteam) {
        if (g.details.developer && g.details.developer !== 'Unknown') {
          for (const sDev of steamDevs) {
            if (isSimilar(g.details.developer, sDev) && g.details.developer !== sDev) {
              g.details.developer = sDev;
              changed = true;
              break;
            }
          }
        }
        if (g.details.publisher && g.details.publisher !== 'Unknown') {
          for (const sPub of steamPubs) {
            if (isSimilar(g.details.publisher, sPub) && g.details.publisher !== sPub) {
              g.details.publisher = sPub;
              changed = true;
              break;
            }
          }
        }
      }
    });

    if (changed) {
      setStreamData(dataCopy);
      notify('Library sync completed successfully!', 'success');
    } else {
      notify('Library is already up to date.', 'info');
    }
    
    setIsSyncing(false);
  };

  const handleSearch = async () => {
    if (!sQ.trim()) { setSR([]); return; }
    setIsS(true);
    try {
      const targetUrl = `/steam-api/api/storesearch/?term=${sQ}&l=english&cc=US`;
      const res = await fetch(targetUrl);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const appIds = data.items.map(i => i.id).join(',');
        try {
          const detailRes = await fetch(`/steam-api/api/appdetails?appids=${appIds}&l=english`);
          const detailData = await detailRes.json();
          
          setSR(data.items.map(item => {
            const d = detailData[item.id]?.data;
            return {
              id: item.id.toString(),
              name: item.name,
              cover_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
              developers: d?.developers ? d.developers.map(dev => ({name: dev})) : [],
              released: d?.release_date?.date || '',
              isRawgOnly: false
            };
          }));
        } catch(err) {
          setSR(data.items.map(item => ({
            id: item.id.toString(),
            name: item.name,
            cover_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`,
            isRawgOnly: false
          })));
        }
      } else {
        const rawgRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(sQ)}&page_size=12`);
        const rawgData = await rawgRes.json();
        if (rawgData.results && rawgData.results.length > 0) {
           setSR(rawgData.results.map(item => ({
              id: item.id.toString(),
              name: item.name,
              cover_image: item.background_image,
              developers: item.developers || [],
              released: item.released || '',
              isRawgOnly: true
           })));
        } else {
           setSR([]);
        }
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally { 
      setIsS(false); 
    }
  };

  const openGameProfile = (gameId, runId = null) => {
    setSelectedGameId(gameId);
    setInitialRunForModal(runId);
  };

  const handleImportDefault = (type = 'full') => {
    fetch('defaultData.json')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Default file not found');
      })
      .then(data => {
        if (type === 'settings') {
          data.type = 'settings_only';
        } else {
          data.type = 'full_backup';
        }
        handleImport(data);
      })
      .catch(() => {
        notify('Could not find defaultData.json in repository', 'error');
      });
  };

  const handleAddGame = async (g) => {
    const rid = g.id.toString();
    if (streamData[rid]) {
      openGameProfile(rid);
      setCurrentView('library');
      return;
    }
    
    notify(g.isRawgOnly ? 'Fetching data from RAWG...' : 'Fetching Steam metadata & RAWG images...', 'info');
    
    const steamUrl = `https://store.steampowered.com/app/${rid}/`;
    
    let details = {
      developer: g.developers?.map(d => d.name).join(', ') || 'Unknown',
      publisher: 'Unknown',
      releaseDate: g.released || new Date().getFullYear().toString(),
      genres: 'Unknown',
      tags: 'Unknown',
      steamUrl: g.isRawgOnly ? '' : steamUrl,
      notOnSteam: g.isRawgOnly || false
    };
    
    let cover_image = g.cover_image;
    let thumbnails = [];
    let finalName = g.name;
    let finalYear = g.released ? new Date(g.released).getFullYear().toString() : new Date().getFullYear().toString();

    try {
      if (g.isRawgOnly) {
         const detailRes = await fetch(`https://api.rawg.io/api/games/${rid}?key=${RAWG_API_KEY}`);
         const detailData = await detailRes.json();
         details.developer = detailData.developers?.map(d => d.name).join(', ') || details.developer;
         details.publisher = detailData.publishers?.map(p => p.name).join(', ') || details.publisher;
         details.releaseDate = detailData.released || details.releaseDate;
         details.genres = detailData.genres?.map(gn => gn.name).join(', ') || details.genres;
         details.tags = detailData.tags?.filter(t => t.language === 'eng').map(t => t.name).join(', ') || details.tags;
         
         if (detailData.background_image) cover_image = detailData.background_image;

         const sRes = await fetch(`https://api.rawg.io/api/games/${rid}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
         const sData = await sRes.json();
         if (sData.results) {
             thumbnails = sData.results.map(x => x.image).filter(Boolean);
         }
      } else {
         const targetUrl = `/steam-api/api/appdetails?appids=${rid}&l=english`;
         const res = await fetch(targetUrl);
         const steamDataObj = await res.json();
         
         const gameDetails = steamDataObj[rid]?.data;
         if (gameDetails) {
           finalName = gameDetails.name || finalName;
           const rDate = gameDetails.release_date?.date;
           finalYear = rDate ? new Date(rDate).getFullYear().toString() : finalYear;
           
           details.developer = gameDetails.developers?.join(', ') || details.developer;
           details.publisher = gameDetails.publishers?.join(', ') || 'Unknown';
           details.releaseDate = rDate || finalYear;
           details.genres = gameDetails.genres?.map(gn => gn.description).join(', ') || 'Unknown';
           
           if (gameDetails.header_image) cover_image = gameDetails.header_image;
           if (gameDetails.screenshots) {
             thumbnails = gameDetails.screenshots.map(s => s.path_full);
           }
         }

         try {
           const cleanName = finalName.replace(/[:™®©]/g, '').trim();
           const rawgSearchRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(cleanName)}&page_size=1`);
           const rawgSearchData = await rawgSearchRes.json();
           
           if (rawgSearchData.results && rawgSearchData.results[0]) {
             const rawgGame = rawgSearchData.results[0];
             
             if (rawgGame.tags) {
               const englishTags = rawgGame.tags.filter(t => t.language === 'eng').map(t => t.name);
               if (englishTags.length > 0) {
                 details.tags = englishTags.join(', ');
               }
             }

             const rawgId = rawgGame.id;
             const sRes = await fetch(`https://api.rawg.io/api/games/${rawgId}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
             const sData = await sRes.json();
             if (sData.results) {
               thumbnails = [...thumbnails, ...sData.results.map(x => x.image)].filter(Boolean);
             }
           }
         } catch (err) {
           console.warn('RAWG fallback failed', err);
         }
      }
      
      thumbnails = [...new Set(thumbnails)];
      notify(`Successfully added ${finalName}!`, 'success');
      
    } catch(e) {
      notify(`Added ${finalName}, but some data failed to load`, 'error');
    }

    setStreamData(prev => ({
      ...prev,
      [rid]: {
        game_name: finalName,
        release_year: finalYear,
        cover_image: cover_image,
        thumbnail_urls: thumbnails,
        cycles: {
          main: {
            stream_count: 0,
            timestamps: [],
            isMain: true,
            youtubePlaylist: '',
            displayName: 'First Playthrough',
            label: 'Ongoing'
          }
        },
        details: details
      }
    }));
    
    openGameProfile(rid);
  };

  const updateGameLink = async (gameId, steamLink) => {
    let steamId = steamLink;
    if (steamLink.includes('steampowered.com/app/')) {
      steamId = steamLink.split('steampowered.com/app/')[1].split('/')[0].split('?')[0];
    }
    notify('Syncing with Steam & RAWG...', 'info');
    try {
      const targetUrl = `/steam-api/api/appdetails?appids=${steamId}&l=english`;
      const res = await fetch(targetUrl);
      const steamDataObj = await res.json();
      
      const gameDetails = steamDataObj[steamId]?.data;
      if (!gameDetails) {
          notify('Invalid Steam link or ID', 'error');
          return;
      }

      let cover_image = gameDetails.header_image;
      let thumbnails = [];
      if (gameDetails.screenshots) {
        thumbnails = gameDetails.screenshots.map(s => s.path_full);
      }
      let tagsString = 'Unknown';

      try {
        const rawgSearchRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(gameDetails.name)}&page_size=1`);
        const rawgSearchData = await rawgSearchRes.json();
        
        if (rawgSearchData.results && rawgSearchData.results[0]) {
            const rawgGame = rawgSearchData.results[0];
            if (rawgGame.tags) {
              const engTags = rawgGame.tags.filter(t => t.language === 'eng').map(t => t.name);
              if (engTags.length > 0) tagsString = engTags.join(', ');
            }

            const rawgId = rawgGame.id;
            const sRes = await fetch(`https://api.rawg.io/api/games/${rawgId}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
            const sData = await sRes.json();
            if (sData.results) {
                thumbnails = [...thumbnails, ...sData.results.map(x => x.image)].filter(Boolean);
            }
        }
      } catch(e) {}

      const nd = JSON.parse(JSON.stringify(streamData));
      nd[gameId].game_name = gameDetails.name;
      const rDate = gameDetails.release_date?.date;
      nd[gameId].release_year = rDate ? new Date(rDate).getFullYear().toString() : nd[gameId].release_year;
      nd[gameId].cover_image = cover_image;
      nd[gameId].thumbnail_urls = [...new Set(thumbnails)];
      nd[gameId].details = {
        developer: gameDetails.developers?.join(', ') || 'Unknown',
        publisher: gameDetails.publishers?.join(', ') || 'Unknown',
        releaseDate: rDate || nd[gameId].release_year,
        genres: gameDetails.genres?.map(g => g.description).join(', ') || 'Unknown',
        tags: tagsString,
        steamUrl: `https://store.steampowered.com/app/${steamId}/`,
        notOnSteam: false
      };
      
      setStreamData(nd);
      notify('Game updated with Steam & RAWG data!', 'success');
    } catch(e) { notify('Update failed', 'error'); }
  };

  const editGameDetails = (gameId, newName, newYear, developer, publisher, genres, tags, steamIdToSync, steamUrl, notOnSteam) => {
    const nd = JSON.parse(JSON.stringify(streamData));
    if (nd[gameId]) {
      nd[gameId].game_name = newName;
      if (newYear) nd[gameId].release_year = newYear;
      
      if (!nd[gameId].details) nd[gameId].details = {};
      if (developer !== undefined) nd[gameId].details.developer = developer;
      if (publisher !== undefined) nd[gameId].details.publisher = publisher;
      if (genres !== undefined) nd[gameId].details.genres = genres;
      if (tags !== undefined) nd[gameId].details.tags = tags;
      if (steamUrl !== undefined) nd[gameId].details.steamUrl = steamUrl;
      if (notOnSteam !== undefined) nd[gameId].details.notOnSteam = notOnSteam;
      
      setStreamData(nd);
      notify(`Game details updated!`, 'success');
      
      if (steamIdToSync) updateGameLink(gameId, steamIdToSync);
    }
  };

  const deleteGame = (id, name) => {
    const nd = { ...streamData };
    delete nd[id];
    setStreamData(nd);
    notify(`Deleted ${name}`, 'error');
  };

  const deleteCycle = (gid, cycId) => {
    const nd = JSON.parse(JSON.stringify(streamData));
    delete nd[gid].cycles[cycId];
    setStreamData(nd);
    notify(`Removed run`, 'error');
  };

  const deleteTimestamp = (gid, cycId, idx) => {
    const nd = JSON.parse(JSON.stringify(streamData));
    nd[gid].cycles[cycId].timestamps.splice(idx, 1);
    nd[gid].cycles[cycId].stream_count = nd[gid].cycles[cycId].timestamps.length;
    setStreamData(nd);
    notify(`Deleted log entry`, 'error');
  };

  const updateCycle = (gameId, oldCycleId, newDisplayName, isMain, youtubePlaylist, newLabel) => {
    const nd = JSON.parse(JSON.stringify(streamData));
    const cycles = nd[gameId].cycles;
    if (!cycles[oldCycleId]) return;
    const cycleData = cycles[oldCycleId];
    const newId = newDisplayName === 'First Playthrough' ? 'main' : newDisplayName.toLowerCase().replace(/\s+/g, '_');
    if (oldCycleId !== newId) {
      delete cycles[oldCycleId];
      cycles[newId] = cycleData;
    }
    cycles[newId].displayName = newDisplayName;
    cycles[newId].isMain = isMain;
    cycles[newId].youtubePlaylist = youtubePlaylist || '';
    if (newLabel) cycles[newId].label = newLabel;
    setStreamData(nd);
    notify(`Run updated to "${newDisplayName}"`, 'success');
  };

  const addCycle = (gameId, displayName) => {
    const formattedName = formatRunName(displayName);
    const newId = formattedName === 'First Playthrough' ? 'main' : formattedName.toLowerCase().replace(/\s+/g, '_');
    const nd = JSON.parse(JSON.stringify(streamData));
    if (nd[gameId].cycles[newId]) {
      notify('A run with that name already exists', 'error');
      return false;
    }
    nd[gameId].cycles[newId] = {
      stream_count: 0,
      timestamps: [],
      isMain: false,
      youtubePlaylist: '',
      displayName: formattedName,
      label: 'Ongoing'
    };
    setStreamData(nd);
    notify(`Run "${formattedName}" created`, 'success');
    return true;
  };

  const handleStartWorkspace = (gameId, cycleId, selectedStreamNumber) => {
    setSelectedGameId(null);
    setWCF({ gameId, cycleId, selectedStreamNumber });
  };

  const handleExport = (type) => {
    let exportData;
    let fileNameStr;
    const dateStr = new Date().toISOString().slice(0,19).replace(/:/g, '-');

    if (type === 'stream') {
      exportData = streamData;
      fileNameStr = `streamtracker_data_${dateStr}.json`;
    } else if (type === 'settings') {
      exportData = {
        version: "2.0.0",
        type: "settings_only",
        thumbnailConfig,
        systemFonts,
        layoutPrefs,
        modalBgIntensity,
        modalPanelOpacity,
        mosaicXGap,
        mosaicYGap,
        exportDate: new Date().toISOString()
      };
      fileNameStr = `streamtracker_settings_${dateStr}.json`;
    } else {
      exportData = {
        version: "2.0.0",
        type: "full_backup",
        streamData,
        thumbnailConfig,
        systemFonts,
        layoutPrefs,
        modalBgIntensity,
        modalPanelOpacity,
        mosaicXGap,
        mosaicYGap,
        exportDate: new Date().toISOString()
      };
      fileNameStr = `streamtracker_full_backup_${dateStr}.json`;
    }
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileNameStr;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  const handleWipeData = (type) => {
    handleExport(type);
    
    setTimeout(() => {
      if (type === 'stream' || type === 'full') {
        setStreamData({});
      }
      if (type === 'settings' || type === 'full') {
        setThumbnailConfig(DEFAULT_THUMBNAIL_CONFIG);
        setSystemFonts(DEFAULT_SYSTEM_FONTS);
        setLayoutPrefs(DEFAULT_LAYOUT_PREFS);
        setModalBgIntensity(DEFAULT_MODAL_BG_INTENSITY);
        setModalPanelOpacity(DEFAULT_MODAL_PANEL_OPACITY);
        setMosaicXGap(0);
        setMosaicYGap(0);
      }
      notify(`Deleted and backed up ${type === 'full' ? 'all' : type} data.`, 'success');
    }, 500); 
  };

  const handleImport = (importedData) => {
    try {
      const isSettingsOnly = importedData.type === 'settings_only';
      const isFullBackup = !isSettingsOnly && (importedData.type === 'full_backup' || importedData.streamData !== undefined);
      const isClassic = !isSettingsOnly && !isFullBackup;

      if (isFullBackup || isClassic) {
        const streamContent = isFullBackup ? importedData.streamData : importedData;
        const { data } = migrateLabels(streamContent);
        setStreamData(data);
      }

      if (isFullBackup || isSettingsOnly) {
        if (importedData.thumbnailConfig) setThumbnailConfig(importedData.thumbnailConfig);
        if (importedData.systemFonts) setSystemFonts(importedData.systemFonts);
        if (importedData.layoutPrefs) setLayoutPrefs(importedData.layoutPrefs);
        if (importedData.modalBgIntensity !== undefined) setModalBgIntensity(importedData.modalBgIntensity);
        if (importedData.modalPanelOpacity !== undefined) setModalPanelOpacity(importedData.modalPanelOpacity);
        if (importedData.mosaicXGap !== undefined) setMosaicXGap(importedData.mosaicXGap);
        if (importedData.mosaicYGap !== undefined) setMosaicYGap(importedData.mosaicYGap);
      }

    } catch (e) {
      notify('Failed to parse import file', 'error');
    }
  };

  return (
    <div className="min-h-screen text-white font-sans antialiased relative bg-black overflow-hidden flex flex-col">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #555; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #888; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="absolute inset-0 z-0 pointer-events-none bg-black">
        {/* 1. The background fading image that fills the screen */}
        <div className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${hoverState.gameId ? 'opacity-100' : 'opacity-0'}`}>
          <CrossfadeImage 
            src={activeBgUrl} 
            className="absolute inset-0 w-full h-full"
            imgClassName="object-cover" 
          />
        </div>

        {/* 2. The flipping mosaic */}
        <div className="absolute inset-0 z-10">
          <MosaicBackground 
            mosaicImages={mosaicImages} 
            isPaused={mosaicPaused} 
            isSlowMode={currentView !== 'stats'} 
            shouldFlip={!!hoverState.gameId} 
          />
        </div>

        {/* 3. Dimming overlay */}
        <div 
          className="absolute inset-0 bg-black transition-opacity duration-300 z-20 pointer-events-none" 
          style={{ opacity: layoutPrefs.bgDimming ?? 0.5 }} 
        />
      </div>

      <div className="relative z-20 flex flex-col h-screen">
        <Header currentView={currentView} onViewChange={setCurrentView} onImport={handleImport} onExport={() => setShowExportModal(true)} />

        <main key={currentView} className="page-transition flex-1 overflow-hidden flex flex-col relative">
          {currentView === 'data' && (
            <div className="flex flex-col h-full overflow-hidden bg-black/40 backdrop-blur-xl">
              <DataManager
                systemFonts={systemFonts} 
                setSystemFonts={setSystemFonts}
                layoutPrefs={layoutPrefs} 
                setLayoutPrefs={setLayoutPrefs}
                modalBgIntensity={modalBgIntensity}
                setModalBgIntensity={setModalBgIntensity}
                modalPanelOpacity={modalPanelOpacity}
                setModalPanelOpacity={setModalPanelOpacity}
                persistSettings={persistSettings}
                setPersistSettings={setPersistSettings}
                onWipeData={handleWipeData}
                onRunSync={handleManualSync}
                isSyncing={isSyncing}
              />
            </div>
          )}
          {currentView === 'dashboard' && (
            <Dashboard
              streamData={streamData}
              handleCardClick={handleCardClick}
              systemFonts={scaledSystemFonts}
              layoutPrefs={scaledLayoutPrefs}
              activeBgUrl={activeBgUrl}
              hoverState={hoverState}
              onHoverGame={handleHoverGame}
              onImportDefault={handleImportDefault}
              hasCustomSettings={hasCustomSettings}
            />
          )}
          {currentView === 'library' && (
            <Library
              streamData={streamData}
              handleCardClick={handleCardClick}
              onDeleteGame={deleteGame}
              onUpdateGameLink={updateGameLink}
              onEditGame={editGameDetails}
              systemFonts={scaledSystemFonts}
              layoutPrefs={scaledLayoutPrefs}
              activeBgUrl={activeBgUrl}
              hoverState={hoverState}
              onHoverGame={handleHoverGame}
              onImportDefault={handleImportDefault}
              hasCustomSettings={hasCustomSettings}
            />
          )}
          {currentView === 'stats' && (
            <Stats 
              streamData={streamData} 
              systemFonts={scaledSystemFonts}
              layoutPrefs={scaledLayoutPrefs}
            />
          )}
          {currentView === 'search' && (() => {
            const containerStyle = {
              paddingLeft: `clamp(16px, ${scaledLayoutPrefs.containerPaddingX}px, 5vw)`,
              paddingRight: `clamp(16px, ${scaledLayoutPrefs.containerPaddingX}px, 5vw)`,
              paddingTop: `clamp(16px, ${scaledLayoutPrefs.containerPaddingY}px, 5vh)`,
              paddingBottom: `clamp(16px, ${scaledLayoutPrefs.containerPaddingY}px, 5vh)`,
            };

            const gridStyle = {
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${scaledLayoutPrefs.cardMaxWidth || 250}px), 1fr))`,
              gap: `${scaledLayoutPrefs.cardGap}px`
            };

            const cardStyle = {
              borderRadius: scaledLayoutPrefs.cardRounded ? `${scaledLayoutPrefs.cardRadius}px` : '0px',
              backgroundColor: `rgba(0, 0, 0, ${scaledLayoutPrefs.panelFillOpacity ?? 0.1})`,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s',
              width: '100%',
              margin: '0 auto'
            };

            return (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="sticky top-0 z-10 border-b border-white/10 px-6 py-4">
                  <div className="max-w-4xl mx-auto relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" size={22} />
                    <input
                      type="text"
                      style={{ fontSize: `${scaledSystemFonts.searchBar}px` }}
                      className="w-full bg-black/60 border border-white/10 rounded-none py-4 pl-12 pr-6 text-lg focus:outline-none transition-colors shadow-inner text-white peer relative z-0"
                      placeholder="Search Steam Database..."
                      value={sQ}
                      onChange={(e) => setSQ(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 peer-focus:opacity-100 transition-opacity duration-300 z-20 pointer-events-none" />
                    {isS && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-blue-400 z-10" size={22} />}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar" style={containerStyle}>
                  <div style={gridStyle}>
                    {sR.map(g => {
                      const isInLibrary = Object.values(streamData).some(existing => 
                        existing.game_name?.toLowerCase() === g.name?.toLowerCase()
                      ) || !!streamData[g.id.toString()];

                      return (
                        <div key={g.id} className="group relative overflow-hidden shadow-xl flex flex-col transition-all duration-300 delay-0 hover:scale-105 hover:shadow-2xl hover:z-10 hover:delay-300" style={cardStyle}>
                          <div className="aspect-video bg-black/40 overflow-hidden relative shrink-0">
                            <img src={g.cover_image || g.background_image || 'https://placehold.co/600x400/1e293b/475569?text=Cover'} alt={g.name} className="absolute inset-0 w-full h-full object-cover" />
                            {g.isRawgOnly && (
                              <span className="absolute top-2 right-2 bg-purple-600/80 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full z-20 shadow">RAWG</span>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
                          </div>
                          
                          <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between" style={{ padding: `clamp(12px, ${scaledLayoutPrefs.cardPadding}px, 20px)` }}>
                            <h3 className="font-bold tracking-tight drop-shadow-md group-hover:text-[#e8c87a] transition-colors duration-300" style={{ fontSize: `${scaledSystemFonts.libTitle}px` }}>{g.name}</h3>
                            
                            {isInLibrary ? (
                              <div className="mt-4 w-full bg-white/5 py-2 rounded-none font-medium flex items-center justify-center text-white/50 cursor-not-allowed border border-white/5">
                                Already in Library
                              </div>
                            ) : (
                              <button onClick={() => handleAddGame(g)} className="mt-4 w-full bg-white/10 hover:bg-white/20 active:scale-95 py-2 rounded-none font-medium flex items-center justify-center gap-2 transition-all border border-white/10">
                                <Plus size={18} /> Add to Library
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowExportModal(false)}>
          <div className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">Export Options</h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"><X size={20} /></button>
            </div>
            <p className="text-sm text-white/70 mb-2">Choose what you want to back up or share:</p>
            <button onClick={() => handleExport('full')} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-medium text-white transition-colors shadow-lg">Stream Data + Settings (Full)</button>
            <button onClick={() => handleExport('stream')} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-medium text-white transition-colors border border-white/5">Stream Data Only (Classic)</button>
            <button onClick={() => handleExport('settings')} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-medium text-white transition-colors border border-white/5">Settings Only</button>
          </div>
        </div>
      )}

      {toast && <Notification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {selectedGameId && (
        <GameProfileModal
          gameId={selectedGameId}
          gameData={streamData[selectedGameId]}
          streamData={streamData}
          onClose={() => { setSelectedGameId(null); setInitialRunForModal(null); }}
          onStartWorkspace={handleStartWorkspace}
          onDeleteCycle={deleteCycle}
          onDeleteTimestamp={deleteTimestamp}
          onNotify={notify}
          systemFonts={scaledSystemFonts}
          modalBgIntensity={modalBgIntensity}
          modalPanelOpacity={modalPanelOpacity}
          initialRunId={initialRunForModal}
          onUpdateCycle={updateCycle}
          onAddCycle={addCycle}
          layoutPrefs={scaledLayoutPrefs}
        />
      )}

      {wCf && (
        <LivestreamSetupWorkspace
          gameId={wCf.gameId}
          cycleName={wCf.cycleId}
          streamData={streamData}
          onBack={(returnedCycleId) => {
            setSelectedGameId(wCf.gameId);
            setInitialRunForModal(returnedCycleId || wCf.cycleId);
            setWCF(null);
          }}
          onSave={setStreamData}
          config={thumbnailConfig}
          setConfig={setThumbnailConfig}
          onNotify={notify}
          selectedStreamNumber={wCf.selectedStreamNumber}
          systemFonts={scaledSystemFonts}
        />
      )}
    </div>
  );
}