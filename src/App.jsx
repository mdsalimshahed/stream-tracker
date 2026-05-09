// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
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

  const [globalImage, setGlobalImage] = useState('');
  const [hoveredImage, setHoveredImage] = useState(null);
  const [hoverState, setHoverState] = useState({ cardId: null, gameId: null });
  const hoverTimeoutRef = useRef(null);

  // Persistence Effects
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
    let pool = [];
    const gameId = hoverState.gameId;
    const isHovering = Boolean(gameId && streamData[gameId]);
    
    if (isHovering) {
      pool = streamData[gameId].thumbnail_urls || [];
    } else {
      pool = Object.values(streamData).flatMap(g => g.thumbnail_urls || []);
    }
    
    pool = [...new Set(pool.filter(Boolean))];
    if (pool.length === 0) return;

    if (isHovering) {
      setHoveredImage(pool[0]);
      setGlobalImage(prev => prev !== pool[0] ? pool[0] : prev);
    } else {
      setHoveredImage(null);
      setGlobalImage(prev => pool.includes(prev) ? prev : pool[Math.floor(Math.random() * pool.length)]);
    }

    const isPaused = selectedGameId || wCf || currentView === 'stats';
    if (isPaused) return;

    const intervalTime = isHovering ? 2500 : (layoutPrefs.cycleInterval || 4000);

    const intervalId = setInterval(() => {
      if (pool.length <= 1) {
        if (isHovering) setHoveredImage(pool[0]);
        setGlobalImage(pool[0]);
        return;
      }
      
      if (isHovering) {
        setHoveredImage(prevHover => {
          const currIdx = pool.indexOf(prevHover);
          const nextIdx = currIdx === -1 ? 0 : (currIdx + 1) % pool.length;
          const nextImg = pool[nextIdx];
          setGlobalImage(nextImg);
          return nextImg;
        });
      } else {
        setGlobalImage(prev => {
          let nextImg = pool[Math.floor(Math.random() * pool.length)];
          let attempts = 0;
          while (nextImg === prev && attempts < 10) {
            nextImg = pool[Math.floor(Math.random() * pool.length)];
            attempts++;
          }
          return nextImg;
        });
      }
    }, intervalTime);

    return () => clearInterval(intervalId);
  }, [hoverState.gameId, streamData, selectedGameId, wCf, currentView, layoutPrefs.cycleInterval]);

  useEffect(() => {
    const recovery = async () => {
      const dataCopy = JSON.parse(JSON.stringify(streamData));
      let changed = false;
      for (const [id, game] of Object.entries(dataCopy)) {
        if (!game.thumbnail_urls || game.thumbnail_urls.length < 2 || !game.details) {
          try {
            const cleanName = game.game_name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
            const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(cleanName)}&page_size=1`);
            const d = await res.json();
            if (d.results && d.results[0]) {
              const bestMatch = d.results[0];
              const detailRes = await fetch(`https://api.rawg.io/api/games/${bestMatch.id}?key=${RAWG_API_KEY}`);
              const details = await detailRes.json();
              const sRes = await fetch(`https://api.rawg.io/api/games/${bestMatch.id}/screenshots?key=${RAWG_API_KEY}`);
              const sData = await sRes.json();
              if (sData.results) {
                const newUrls = [bestMatch.background_image, ...sData.results.map(x => x.image)].filter(Boolean).slice(0, 15);
                game.thumbnail_urls = newUrls;
                changed = true;
              }
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

  const handleAddGame = async (g) => {
    const rid = g.id.toString();
    if (streamData[rid]) {
      openGameProfile(rid);
      setCurrentView('library');
      return;
    }
    const year = g.released ? g.released.substring(0, 4) : new Date().getFullYear().toString();
    const cover = g.background_image || 'https://placehold.co/600x400/1e293b/475569?text=Cover';
    let details = {
      developer: g.developers?.[0]?.name || 'Unknown',
      publisher: 'Unknown',
      releaseDate: g.released || year,
      genres: g.genres?.map(gn => gn.name).join(', ') || 'Unknown',
      tags: g.tags?.map(t => t.name).join(', ') || 'Unknown'
    };
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
    } catch(e) {}
    setStreamData({
      ...streamData,
      [rid]: {
        game_name: g.name,
        release_year: year,
        thumbnail_urls: [cover],
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
    });
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
        const sRes = await fetch(`https://api.rawg.io/api/games/${data.id}/screenshots?key=${RAWG_API_KEY}`);
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
        notify('Game updated!', 'success');
      } else notify('Invalid RAWG link', 'error');
    } catch(e) { notify('Update failed', 'error'); }
  };

  const editGameDetails = (gameId, newName, newYear, rawgId) => {
    const nd = JSON.parse(JSON.stringify(streamData));
    if (nd[gameId]) {
      nd[gameId].game_name = newName;
      if (newYear) nd[gameId].release_year = newYear;
      setStreamData(nd);
      notify(`Game updated to "${newName}"`, 'success');
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

  const handleExport = () => {
    const exportData = {
      version: "2.0.0",
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
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `streamtracker_full_backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Full backup (Library + Styles) exported', 'success');
  };

  const handleImport = (importedData) => {
    try {
      const isNewFormat = importedData.streamData !== undefined;
      const streamContent = isNewFormat ? importedData.streamData : importedData;

      const { data, changed } = migrateLabels(streamContent);
      setStreamData(data);

      if (isNewFormat) {
        if (importedData.thumbnailConfig) setThumbnailConfig(importedData.thumbnailConfig);
        if (importedData.systemFonts) setSystemFonts(importedData.systemFonts);
        if (importedData.layoutPrefs) setLayoutPrefs(importedData.layoutPrefs);
        if (importedData.modalBgIntensity !== undefined) setModalBgIntensity(importedData.modalBgIntensity);
        if (importedData.modalPanelOpacity !== undefined) setModalPanelOpacity(importedData.modalPanelOpacity);
        if (importedData.mosaicXGap !== undefined) setMosaicXGap(importedData.mosaicXGap);
        if (importedData.mosaicYGap !== undefined) setMosaicYGap(importedData.mosaicYGap);
        
        notify('Library and Style settings restored completely', 'success');
      } else {
        if (changed) notify('Old labels migrated to first run.', 'info');
        else notify('Library restored (Classic format)', 'success');
      }
    } catch (e) {
      notify('Failed to parse import file', 'error');
    }
  };

  return (
    <div className="min-h-screen text-white antialiased relative bg-black overflow-hidden flex flex-col">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #555; border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #888; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {currentView !== 'stats' && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <CrossfadeImage 
            src={globalImage || 'https://placehold.co/1920x1080/1a1a1a/333333?text=Loading'} 
            className="absolute inset-0 w-full h-full"
            imgClassName="object-cover" 
          />
          <div 
            className="absolute inset-0 bg-black transition-opacity duration-300" 
            style={{ opacity: layoutPrefs.bgDimming ?? 0.5 }} 
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col h-screen">
        <Header currentView={currentView} onViewChange={setCurrentView} onImport={handleImport} onExport={handleExport} />

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
              />
            </div>
          )}
          {currentView === 'dashboard' && (
            <Dashboard
              streamData={streamData}
              openGameProfile={openGameProfile}
              systemFonts={systemFonts}
              layoutPrefs={layoutPrefs}
              globalImage={globalImage}
              hoveredImage={hoveredImage}
              hoverState={hoverState}
              onHoverGame={handleHoverGame}
            />
          )}
          {currentView === 'library' && (
            <Library
              streamData={streamData}
              openGameProfile={openGameProfile}
              onDeleteGame={deleteGame}
              onUpdateGameLink={updateGameLink}
              onEditGame={editGameDetails}
              systemFonts={systemFonts}
              layoutPrefs={layoutPrefs}
              globalImage={globalImage}
              hoveredImage={hoveredImage}
              hoverState={hoverState}
              onHoverGame={handleHoverGame}
            />
          )}
          {currentView === 'stats' && (
            <Stats 
              streamData={streamData} 
              mosaicXGap={mosaicXGap} 
              mosaicYGap={mosaicYGap} 
            />
          )}
          {currentView === 'search' && (() => {
            const containerStyle = {
              paddingLeft: `clamp(16px, ${layoutPrefs.containerPaddingX}px, 5vw)`,
              paddingRight: `clamp(16px, ${layoutPrefs.containerPaddingX}px, 5vw)`,
              paddingTop: `clamp(16px, ${layoutPrefs.containerPaddingY}px, 5vh)`,
              paddingBottom: `clamp(16px, ${layoutPrefs.containerPaddingY}px, 5vh)`,
            };

            const gridStyle = {
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, 260px), 1fr))`,
              gap: `${layoutPrefs.cardGap}px`
            };

            const cardStyle = {
              borderRadius: layoutPrefs.cardRounded ? `${layoutPrefs.cardRadius}px` : '0px',
              backgroundColor: `rgba(0, 0, 0, ${layoutPrefs.panelFillOpacity ?? 0.1})`,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s',
              maxWidth: `${layoutPrefs.cardMaxWidth || 320}px`,
              width: '100%',
              margin: '0 auto'
            };

            return (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="sticky top-0 z-10 border-b border-white/10 px-6 py-4">
                  <div className="max-w-4xl mx-auto relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={22} />
                    <input
                      type="text"
                      style={{ fontSize: `${systemFonts.searchBar}px` }}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 pl-12 pr-24 text-lg focus:outline-none focus:border-yellow-500 transition-colors shadow-inner text-white"
                      placeholder="Search RAWG database..."
                      value={sQ}
                      onChange={(e) => setSQ(e.target.value)}
                    />
                    {isS && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-blue-400" size={22} />}
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
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30" />
                          </div>
                          
                          <div className="p-3 sm:p-4 flex flex-col flex-1" style={{ padding: `clamp(12px, ${layoutPrefs.cardPadding}px, 20px)` }}>
                            <h3 className="font-bold tracking-tight flex-1 drop-shadow-md group-hover:text-[#e8c87a] transition-colors duration-300" style={{ fontSize: `${systemFonts.libTitle}px` }}>{g.name}</h3>
                            <p className="text-white/80 mt-1 drop-shadow-md" style={{ fontSize: `${systemFonts.libYear}px` }}>
                              {g.developers?.map(d => d.name).join(', ') || 'Unknown Developer'}
                            </p>
                            <p className="text-white/60 mt-1 mb-auto" style={{ fontSize: `${Math.max(10, systemFonts.libYear - 2)}px` }}>
                              {g.released ? formatReleaseDate(g.released) : 'Unreleased'}
                            </p>
                            
                            {isInLibrary ? (
                              <div className="mt-4 w-full bg-white/5 py-2 rounded-xl font-medium flex items-center justify-center text-white/50 cursor-not-allowed border border-white/5">
                                Already in Library
                              </div>
                            ) : (
                              <button onClick={() => handleAddGame(g)} className="mt-4 w-full bg-white/10 hover:bg-white/20 active:scale-95 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-white/10">
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

      {toast && <Notification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {selectedGameId && (
        <GameProfileModal
          gameId={selectedGameId}
          gameData={streamData[selectedGameId]}
          onClose={() => { setSelectedGameId(null); setInitialRunForModal(null); }}
          onStartWorkspace={handleStartWorkspace}
          onDeleteCycle={deleteCycle}
          onDeleteTimestamp={deleteTimestamp}
          onNotify={notify}
          systemFonts={systemFonts}
          modalBgIntensity={modalBgIntensity}
          modalPanelOpacity={modalPanelOpacity}
          initialRunId={initialRunForModal}
          onUpdateCycle={updateCycle}
          onAddCycle={addCycle}
          layoutPrefs={layoutPrefs}
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
          systemFonts={systemFonts}
        />
      )}
    </div>
  );
}