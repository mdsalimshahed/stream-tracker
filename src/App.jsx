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

// --- Mosaic Component (Web Animations API) ---
const MosaicBackground = React.memo(({ mosaicImages, isPaused, isSlowMode }) => {
  const ROWS = 6;
  const IMGS_PER_ROW = 40;

  const rowRefs = useRef([]);
  const animationsRef = useRef([]);

  const rowsConfig = useMemo(() => {
    const fallback = { url: 'https://placehold.co/110x110/0d1117/1e2938?text=', gameId: 'fallback' };
    const pool = mosaicImages && mosaicImages.length > 0 ? mosaicImages : [fallback];

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

      const duration = 60000 + Math.random() * 60000; 
      const direction = i % 2 === 0 ? 'left' : 'right';

      return {
        imgs: [...base.map(b => b.url), ...base.map(b => b.url)],
        duration,
        direction
      };
    });
  }, [mosaicImages]);

  useEffect(() => {
    animationsRef.current.forEach(anim => anim.cancel());
    animationsRef.current = [];

    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      const config = rowsConfig[i];
      
      const keyframes = config.direction === 'left' 
        ? [ { transform: 'translate3d(0, 0, 0)' }, { transform: 'translate3d(-50%, 0, 0)' } ]
        : [ { transform: 'translate3d(-50%, 0, 0)' }, { transform: 'translate3d(0, 0, 0)' } ];

      const animation = el.animate(keyframes, {
        duration: config.duration,
        iterations: Infinity,
        easing: 'linear'
      });

      animation.playbackRate = isSlowMode ? 0.125 : 1;
      if (isPaused) animation.pause();

      animationsRef.current.push(animation);
    });

    return () => {
      animationsRef.current.forEach(anim => anim.cancel());
    };
  }, [rowsConfig]); 

  useEffect(() => {
    animationsRef.current.forEach(anim => {
      if (isPaused) {
        anim.pause();
      } else {
        anim.playbackRate = isSlowMode ? 0.125 : 1; 
        if (anim.playState === 'paused') {
          anim.play();
        }
      }
    });
  }, [isPaused, isSlowMode]);

  return (
    <div className="absolute inset-0 z-[-10] overflow-hidden pointer-events-none bg-black">
      <div className="flex flex-col h-full">
        {rowsConfig.map((row, ri) => (
          <div 
            key={ri} 
            className="flex-1 flex items-stretch will-change-transform" 
            style={{ width: 'max-content' }}
            ref={el => rowRefs.current[ri] = el}
          >
            {row.imgs.map((src, ii) => (
              <img key={ii} className="shrink-0 w-[110px] h-full object-cover block" src={src} alt="" loading="lazy" />
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
    if (!checkPersist()) return DEFAULT_LAYOUT_PREFS;
    try {
      const s = localStorage.getItem('layoutPrefs');
      return s ? { ...DEFAULT_LAYOUT_PREFS, ...JSON.parse(s) } : DEFAULT_LAYOUT_PREFS;
    } catch(e) { return DEFAULT_LAYOUT_PREFS; }
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

  const [mosaicXGap, setMosaicXGap] = useState(() => {
    if (!checkPersist()) return 0;
    try { const s = localStorage.getItem('mosaicXGap'); return s !== null ? parseInt(s) : 0; } catch(e) { return 0; }
  });

  const [mosaicYGap, setMosaicYGap] = useState(() => {
    if (!checkPersist()) return 0;
    try { const s = localStorage.getItem('mosaicYGap'); return s !== null ? parseInt(s) : 0; } catch(e) { return 0; }
  });

  const [currentView, setCurrentView] = useState(() => {
    try {
      const s = localStorage.getItem('streamManagerData');
      if (s && Object.keys(JSON.parse(s)).length > 0) return 'dashboard';
    } catch(e) {}
    return 'data';
  });
  
  const [toast, setToast] = useState(null);
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

  const globalPlaylistRef = useRef([]);
  const globalIndexRef = useRef(0);
  const hoverPlaylistRef = useRef({ gameId: null, list: [], index: -1 });

  if (globalPlaylistRef.current.length === 0 && Object.keys(streamData).length > 0) {
    globalPlaylistRef.current = generateGlobalPlaylist(streamData);
  }

  const [globalImage, setGlobalImage] = useState(() => {
    return globalPlaylistRef.current.length > 0 ? globalPlaylistRef.current[0].url : '';
  });
  
  const [hoveredImage, setHoveredImage] = useState(null);
  const [hoverState, setHoverState] = useState({ cardId: null, gameId: null });
  const hoverTimeoutRef = useRef(null);
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

  useEffect(() => { 
    if (persistSettings) localStorage.setItem('thumbnailConfig', JSON.stringify(thumbnailConfig)); 
    else localStorage.removeItem('thumbnailConfig');
  }, [thumbnailConfig, persistSettings]);

  useEffect(() => { 
    if (persistSettings) localStorage.setItem('systemFonts', JSON.stringify(systemFonts)); 
    else localStorage.removeItem('systemFonts');
  }, [systemFonts, persistSettings]);

  useEffect(() => { 
    if (persistSettings) localStorage.setItem('layoutPrefs', JSON.stringify(layoutPrefs)); 
    else localStorage.removeItem('layoutPrefs');
  }, [layoutPrefs, persistSettings]);

  useEffect(() => { 
    if (persistSettings) localStorage.setItem('modalBgIntensity', modalBgIntensity); 
    else localStorage.removeItem('modalBgIntensity');
  }, [modalBgIntensity, persistSettings]);

  useEffect(() => { 
    if (persistSettings) localStorage.setItem('modalPanelOpacity', modalPanelOpacity); 
    else localStorage.removeItem('modalPanelOpacity');
  }, [modalPanelOpacity, persistSettings]);

  useEffect(() => { 
    if (persistSettings) localStorage.setItem('mosaicXGap', mosaicXGap); 
    else localStorage.removeItem('mosaicXGap');
  }, [mosaicXGap, persistSettings]);

  useEffect(() => { 
    if (persistSettings) localStorage.setItem('mosaicYGap', mosaicYGap); 
    else localStorage.removeItem('mosaicYGap');
  }, [mosaicYGap, persistSettings]);


  const handleHoverGame = (cardId, gameId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    if (cardId === null) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverState({ cardId: null, gameId: null });
      }, 300);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverState({ cardId, gameId });
      }, 900);
    }
  };

  useEffect(() => {
    if (selectedGameId || wCf) {
      setMosaicPaused(true);
      return;
    }
    
    if (hoverState.gameId) {
      const timer = setTimeout(() => setMosaicPaused(true), 1000); 
      return () => clearTimeout(timer);
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
        
        setHoveredImage(null); 
        
        if (rawImages.length > 0) {
          setGlobalImage(rawImages[0]); 
        }
      } else {
        const idx = hoverPlaylistRef.current.index;
        const currentImg = idx >= 0 ? hoverPlaylistRef.current.list[idx] : null;
        setHoveredImage(currentImg);
        if (currentImg) {
          setGlobalImage(currentImg);
        } else if (streamData[gameId].thumbnail_urls?.length > 0) {
          setGlobalImage(streamData[gameId].thumbnail_urls[0]);
        }
      }

      const hList = hoverPlaylistRef.current.list;
      if (hList.length > 1) {
        intervalId = setInterval(() => {
          let idx = hoverPlaylistRef.current.index + 1;
          
          if (idx >= hoverPlaylistRef.current.list.length) {
            const lastImg = hoverPlaylistRef.current.list[hoverPlaylistRef.current.list.length - 1];
            hoverPlaylistRef.current.list = generateSingleGamePlaylist(streamData[gameId].thumbnail_urls || [], lastImg);
            idx = 0;
          }
          
          hoverPlaylistRef.current.index = idx;
          const nextImg = hoverPlaylistRef.current.list[idx];
          setHoveredImage(nextImg);
          setGlobalImage(nextImg);
        }, 2500);
      }
    } else {
      setHoveredImage(null);

      if (globalPlaylistRef.current.length === 0 && Object.keys(streamData).length > 0) {
        globalPlaylistRef.current = generateGlobalPlaylist(streamData);
        globalIndexRef.current = 0;
      }

      const gList = globalPlaylistRef.current;
      
      if (gList.length > 0) {
        setGlobalImage(gList[globalIndexRef.current]?.url || '');
      }

      if (gList.length > 1) {
        intervalId = setInterval(() => {
          let idx = globalIndexRef.current + 1;
          
          if (idx >= globalPlaylistRef.current.length) {
            const lastGameId = globalPlaylistRef.current[globalPlaylistRef.current.length - 1]?.gameId;
            globalPlaylistRef.current = generateGlobalPlaylist(streamData, lastGameId);
            idx = 0;
          }
          
          globalIndexRef.current = idx;
          setGlobalImage(globalPlaylistRef.current[idx].url);
        }, layoutPrefs.cycleInterval || 4000);
      }
    }

    return () => clearInterval(intervalId);
  }, [hoverState.gameId, streamData, selectedGameId, wCf, layoutPrefs.cycleInterval]);

  useEffect(() => {
    const recovery = async () => {
      const dataCopy = JSON.parse(JSON.stringify(streamData));
      let changed = false;
      
      for (const [id, game] of Object.entries(dataCopy)) {
        if (!game.thumbnail_urls || game.thumbnail_urls.length < 2 || !game.details) {
          try {
            let targetId = id;
            let cover = game.thumbnail_urls?.[0];
            
            if (!/^\d+$/.test(targetId)) {
              const cleanName = game.game_name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
              const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(cleanName)}&page_size=1`);
              const d = await res.json();
              if (d.results && d.results[0]) {
                targetId = d.results[0].id;
                if (!cover) cover = d.results[0].background_image;
              } else {
                continue;
              }
            }
            
            const detailRes = await fetch(`https://api.rawg.io/api/games/${targetId}?key=${RAWG_API_KEY}`);
            const details = await detailRes.json();
            
            const sRes = await fetch(`https://api.rawg.io/api/games/${targetId}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
            const sData = await sRes.json();
            
            if (sData.results) {
              const newUrls = [cover || details.background_image, ...sData.results.map(x => x.image)].filter(Boolean);
              game.thumbnail_urls = [...new Set(newUrls)];
              changed = true;
            }
            
            if (!game.details || Object.keys(game.details).length === 0) {
              game.details = {
                developer: details.developers?.[0]?.name || 'Unknown',
                publisher: details.publishers?.[0]?.name || 'Unknown',
                releaseDate: details.released || game.release_year,
                genres: details.genres?.map(g => g.name).join(', ') || 'Unknown',
                tags: details.tags?.map(t => t.name).join(', ') || 'Unknown',
              };
              changed = true;
            }
          } catch(e) {}
        }
      }
      if (changed) setStreamData(dataCopy);
    };
    
    if (Object.keys(streamData).length > 0) recovery();
  }, []);

  useEffect(() => {
    if (!sQ.trim()) { setSR([]); return; }
    const delay = setTimeout(async () => {
      setIsS(true);
      try {
        const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(sQ)}&page_size=12`);
        const data = await res.json();
        if (data.results) {
          const detailed = await Promise.all(
            data.results.map(async (g) => {
              try {
                if (g.developers) return g;
                const dRes = await fetch(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_API_KEY}`);
                const dData = await dRes.json();
                return { ...g, developers: dData.developers };
              } catch (e) {
                return g;
              }
            })
          );
          setSR(detailed);
        } else {
          setSR([]);
        }
      } catch (err) {} finally { setIsS(false); }
    }, 400);
    return () => clearTimeout(delay);
  }, [sQ]);

  const notify = (msg, type) => setToast({ message: msg, type });

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
    
    notify('Fetching game metadata & screenshots...', 'info');
    
    const year = g.released ? g.released.substring(0, 4) : new Date().getFullYear().toString();
    const cover = g.background_image || 'https://placehold.co/600x400/1e293b/475569?text=Cover';
    
    let details = {
      developer: g.developers?.[0]?.name || 'Unknown',
      publisher: 'Unknown',
      releaseDate: g.released || year,
      genres: g.genres?.map(gn => gn.name).join(', ') || 'Unknown',
      tags: g.tags?.map(t => t.name).join(', ') || 'Unknown'
    };
    
    let thumbnails = [cover];

    try {
      const detailRes = await fetch(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_API_KEY}`);
      const detailsData = await detailRes.json();
      
      details = {
        developer: detailsData.developers?.[0]?.name || details.developer,
        publisher: detailsData.publishers?.[0]?.name || 'Unknown',
        releaseDate: detailsData.released || details.releaseDate,
        genres: detailsData.genres?.map(gn => gn.name).join(', ') || details.genres,
        tags: detailsData.tags?.map(t => t.name).join(', ') || details.tags,
      };
      
      const sRes = await fetch(`https://api.rawg.io/api/games/${g.id}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
      const sData = await sRes.json();
      
      if (sData.results) {
        thumbnails = [cover, ...sData.results.map(x => x.image)].filter(Boolean);
        thumbnails = [...new Set(thumbnails)];
      }
      notify(`Successfully added ${g.name}!`, 'success');
    } catch(e) {
      notify(`Added ${g.name}, but some images failed to load`, 'error');
    }

    setStreamData(prev => ({
      ...prev,
      [rid]: {
        game_name: g.name,
        release_year: year,
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

  const updateGameLink = async (gameId, rawgLink) => {
    let rawgId = rawgLink;
    if (rawgLink.includes('rawg.io/games/')) rawgId = rawgLink.split('rawg.io/games/')[1].split('/')[0].split('?')[0];
    notify('Syncing with RAWG...', 'info');
    try {
      const res = await fetch(`https://api.rawg.io/api/games/${rawgId}?key=${RAWG_API_KEY}`);
      const data = await res.json();
      if (data.id) {
        const sRes = await fetch(`https://api.rawg.io/api/games/${data.id}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
        const sData = await sRes.json();
        const nd = JSON.parse(JSON.stringify(streamData));
        nd[gameId].game_name = data.name;
        nd[gameId].release_year = data.released?.substring(0, 4) || nd[gameId].release_year;
        nd[gameId].thumbnail_urls = [data.background_image, ...sData.results.map(x => x.image)].filter(Boolean);
        nd[gameId].details = {
          developer: data.developers?.[0]?.name || 'Unknown',
          publisher: data.publishers?.[0]?.name || 'Unknown',
          releaseDate: data.released || nd[gameId].release_year,
          genres: data.genres?.map(g => g.name).join(', ') || 'Unknown',
          tags: data.tags?.map(t => t.name).join(', ') || 'Unknown',
        };
        setStreamData(nd);
        notify('Game updated with RAWG metadata!', 'success');
      } else notify('Invalid RAWG link', 'error');
    } catch(e) { notify('Update failed', 'error'); }
  };

  const editGameDetails = (gameId, newName, newYear, developer, publisher, genres, tags, rawgId) => {
    const nd = JSON.parse(JSON.stringify(streamData));
    if (nd[gameId]) {
      nd[gameId].game_name = newName;
      if (newYear) nd[gameId].release_year = newYear;
      
      if (!nd[gameId].details) nd[gameId].details = {};
      if (developer !== undefined) nd[gameId].details.developer = developer;
      if (publisher !== undefined) nd[gameId].details.publisher = publisher;
      if (genres !== undefined) nd[gameId].details.genres = genres;
      if (tags !== undefined) nd[gameId].details.tags = tags;
      
      setStreamData(nd);
      notify(`Game details updated!`, 'success');
      
      if (rawgId) updateGameLink(gameId, rawgId);
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

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${hoverState.gameId ? 'opacity-0' : 'opacity-100'}`}>
          <MosaicBackground mosaicImages={mosaicImages} isPaused={mosaicPaused} isSlowMode={currentView !== 'stats'} />
        </div>

        <div className={`absolute inset-0 transition-opacity duration-1000 ${hoverState.gameId ? 'opacity-100' : 'opacity-0'}`}>
          <CrossfadeImage 
            src={globalImage || 'https://placehold.co/1920x1080/1a1a1a/333333?text=Loading'} 
            className="absolute inset-0 w-full h-full"
            imgClassName="object-cover" 
          />
        </div>

        <div 
          className="absolute inset-0 bg-black transition-opacity duration-300 z-10 pointer-events-none" 
          style={{ opacity: layoutPrefs.bgDimming ?? 0.5 }} 
        />
      </div>

      <div className="relative z-20 flex flex-col h-screen">
        <Header currentView={currentView} onViewChange={setCurrentView} onImport={handleImport} onExport={() => setShowExportModal(true)} />

        <main className="flex-1 overflow-hidden flex flex-col relative">
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
              />
            </div>
          )}
          {currentView === 'dashboard' && (
            <Dashboard
              streamData={streamData}
              openGameProfile={openGameProfile}
              systemFonts={scaledSystemFonts}
              layoutPrefs={scaledLayoutPrefs}
              globalImage={globalImage}
              hoveredImage={hoveredImage}
              hoverState={hoverState}
              onHoverGame={handleHoverGame}
              onImportDefault={handleImportDefault}
              hasCustomSettings={hasCustomSettings}
            />
          )}
          {currentView === 'library' && (
            <Library
              streamData={streamData}
              openGameProfile={openGameProfile}
              onDeleteGame={deleteGame}
              onUpdateGameLink={updateGameLink}
              onEditGame={editGameDetails}
              systemFonts={scaledSystemFonts}
              layoutPrefs={scaledLayoutPrefs}
              globalImage={globalImage}
              hoveredImage={hoveredImage}
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
                      className="w-full bg-black/60 border border-white/10 rounded-none py-4 pl-12 pr-24 text-lg focus:outline-none transition-colors shadow-inner text-white peer relative z-0"
                      placeholder="Search RAWG database..."
                      value={sQ}
                      onChange={(e) => setSQ(e.target.value)}
                    />
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 peer-focus:opacity-100 transition-opacity duration-300 z-20 pointer-events-none" />
                    {isS && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-blue-400 z-10" size={22} />}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar" style={containerStyle}>
                  <div style={gridStyle}>
                    {sR.map(g => {
                      const isInLibrary = Object.values(streamData).some(existing => 
                        existing.game_name?.toLowerCase() === g.name?.toLowerCase() && 
                        (existing.details?.releaseDate === g.released || existing.release_year === (g.released ? g.released.substring(0, 4) : ''))
                      ) || !!streamData[g.id.toString()];

                      return (
                        <div key={g.id} className="group relative overflow-hidden shadow-xl flex flex-col transition-all duration-300 delay-0 hover:scale-105 hover:shadow-2xl hover:z-10 hover:delay-300" style={cardStyle}>
                          <div className="aspect-video bg-black/40 overflow-hidden relative shrink-0">
                            <img src={g.background_image || 'https://placehold.co/600x400/1e293b/475569?text=Cover'} alt={g.name} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
                          </div>
                          
                          <div className="p-3 sm:p-4 flex flex-col flex-1" style={{ padding: `clamp(12px, ${scaledLayoutPrefs.cardPadding}px, 20px)` }}>
                            <h3 className="font-bold tracking-tight flex-1 drop-shadow-md group-hover:text-[#e8c87a] transition-colors duration-300" style={{ fontSize: `${scaledSystemFonts.libTitle}px` }}>{g.name}</h3>
                            <p className="text-white/80 mt-1 drop-shadow-md" style={{ fontSize: `${scaledSystemFonts.libYear}px` }}>
                              {g.developers?.map(d => d.name).join(', ') || 'Unknown Developer'}
                            </p>
                            <p className="text-white/60 mt-1 mb-auto" style={{ fontSize: `${Math.max(10, scaledSystemFonts.libYear - 2)}px` }}>
                              {g.released ? formatReleaseDate(g.released) : 'Unreleased'}
                            </p>
                            
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