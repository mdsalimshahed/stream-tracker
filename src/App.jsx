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

export default function App() {
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
    try {
      const s = localStorage.getItem('systemFonts');
      return s ? JSON.parse(s) : DEFAULT_SYSTEM_FONTS;
    } catch(e) { return DEFAULT_SYSTEM_FONTS; }
  });
  const [layoutPrefs, setLayoutPrefs] = useState(() => {
    try {
      const s = localStorage.getItem('layoutPrefs');
      return s ? { ...DEFAULT_LAYOUT_PREFS, ...JSON.parse(s) } : DEFAULT_LAYOUT_PREFS;
    } catch(e) { return DEFAULT_LAYOUT_PREFS; }
  });
  const [modalBgIntensity, setModalBgIntensity] = useState(() => {
    try {
      const s = localStorage.getItem('modalBgIntensity');
      return s !== null ? parseFloat(s) : DEFAULT_MODAL_BG_INTENSITY;
    } catch(e) { return DEFAULT_MODAL_BG_INTENSITY; }
  });
  const [modalPanelOpacity, setModalPanelOpacity] = useState(() => {
    try {
      const s = localStorage.getItem('modalPanelOpacity');
      return s !== null ? parseFloat(s) : DEFAULT_MODAL_PANEL_OPACITY;
    } catch(e) { return DEFAULT_MODAL_PANEL_OPACITY; }
  });
  const [mosaicXGap, setMosaicXGap] = useState(() => {
    try { const s = localStorage.getItem('mosaicXGap'); return s !== null ? parseInt(s) : 0; } catch(e) { return 0; }
  });
  const [mosaicYGap, setMosaicYGap] = useState(() => {
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
  const [hoverState, setHoverState] = useState({ cardId: null, gameId: null });
  const hoverTimeoutRef = useRef(null);

  useEffect(() => { localStorage.setItem('streamManagerData', JSON.stringify(streamData)); }, [streamData]);
  useEffect(() => { localStorage.setItem('thumbnailConfig', JSON.stringify(thumbnailConfig)); }, [thumbnailConfig]);
  useEffect(() => { localStorage.setItem('systemFonts', JSON.stringify(systemFonts)); }, [systemFonts]);
  useEffect(() => { localStorage.setItem('layoutPrefs', JSON.stringify(layoutPrefs)); }, [layoutPrefs]);
  useEffect(() => { localStorage.setItem('modalBgIntensity', modalBgIntensity); }, [modalBgIntensity]);
  useEffect(() => { localStorage.setItem('modalPanelOpacity', modalPanelOpacity); }, [modalPanelOpacity]);
  useEffect(() => { localStorage.setItem('mosaicXGap', mosaicXGap); }, [mosaicXGap]);
  useEffect(() => { localStorage.setItem('mosaicYGap', mosaicYGap); }, [mosaicYGap]);

  const handleHoverGame = (cardId, gameId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    if (cardId === null) {
      // Longer delay when leaving a card so that jumping between cards 
      // doesn't cause a jarring flash to a random background image.
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverState({ cardId: null, gameId: null });
      }, 400);
    } else {
      // Delay before triggering hover to ignore frantic mouse movements.
      hoverTimeoutRef.current = setTimeout(() => {
        setHoverState({ cardId, gameId });
      }, 250);
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

    // Set global image safely. If hovering, strictly start from the cover (pool[0]) to prevent abrupt flash.
    setGlobalImage(prev => {
      if (isHovering) {
        return prev !== pool[0] ? pool[0] : prev;
      } else {
        return pool.includes(prev) ? prev : pool[Math.floor(Math.random() * pool.length)];
      }
    });

    const isPaused = selectedGameId || wCf || currentView === 'stats';
    if (isPaused) return;

    const intervalTime = isHovering ? 2500 : (layoutPrefs.cycleInterval || 4000);

    const intervalId = setInterval(() => {
      setGlobalImage(prev => {
        if (pool.length <= 1) return pool[0]; 
        
        if (isHovering) {
          // Sequential cycling for hovered card to avoid repeats
          const currIdx = pool.indexOf(prev);
          const nextIdx = currIdx === -1 ? 0 : (currIdx + 1) % pool.length;
          return pool[nextIdx];
        } else {
          // Smooth random cycling for idle state without consecutive repeats
          let nextImg = pool[Math.floor(Math.random() * pool.length)];
          let attempts = 0;
          while (nextImg === prev && attempts < 10) {
            nextImg = pool[Math.floor(Math.random() * pool.length)];
            attempts++;
          }
          return nextImg;
        }
      });
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
        setSR(data.results || []);
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
      developer: 'Unknown',
      publisher: 'Unknown',
      releaseDate: year,
      genres: 'Unknown',
      tags: 'Unknown'
    };
    try {
      const detailRes = await fetch(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_API_KEY}`);
      const detailsData = await detailRes.json();
      details = {
        developer: detailsData.developers?.[0]?.name || 'Unknown',
        publisher: detailsData.publishers?.[0]?.name || 'Unknown',
        releaseDate: detailsData.released || year,
        genres: detailsData.genres?.map(g => g.name).join(', ') || 'Unknown',
        tags: detailsData.tags?.map(t => t.name).join(', ') || 'Unknown',
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
    const dataStr = JSON.stringify(streamData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `streamtracker_backup_${new Date().toISOString().slice(0,19)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Backup exported', 'success');
  };

  const handleImport = (importedData) => {
    const { data, changed } = migrateLabels(importedData);
    setStreamData(data);
    if (changed) notify('Old labels migrated to first run.', 'info');
    else notify('Library restored', 'success');
  };

  return (
    <div className="min-h-screen text-white font-sans antialiased relative bg-black overflow-hidden flex flex-col">
      {/* CRITICAL FIX: 
        Added height explicitly to horizontal scrollbar to ensure it renders on all screens.
      */}
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
          {currentView === 'search' && (
            <div className="flex flex-col h-full overflow-hidden bg-black/40 backdrop-blur-xl">
              <div className="sticky top-0 z-10 border-b border-white/10 px-6 py-4">
                <div className="max-w-4xl mx-auto relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={22} />
                  <input
                    type="text"
                    style={{ fontSize: `${systemFonts.searchBar}px` }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-24 text-lg focus:outline-none focus:border-blue-500 transition shadow-inner"
                    placeholder="Search RAWG database..."
                    value={sQ}
                    onChange={(e) => setSQ(e.target.value)}
                  />
                  {isS && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-blue-400" size={22} />}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6">
                <div className="max-w-7xl mx-auto grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
                  {sR.map(g => (
                    <div key={g.id} className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition group shadow-lg backdrop-blur-md flex flex-col">
                      <div className="aspect-video bg-black/40 overflow-hidden relative shrink-0">
                        <img src={g.background_image} alt={g.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-xl">{g.name}</h3>
                        <p className="text-white/60 text-sm mt-1 mb-auto">{g.released || 'Unreleased'}</p>
                        <button onClick={() => handleAddGame(g)} className="mt-4 w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition">
                          <Plus size={18} /> Add to Library
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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