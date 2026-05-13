// src/components/GameProfileModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Gamepad2, Clock, Plus, Trash2, Edit3, Star, PlayCircle } from 'lucide-react';
import { formatReleaseDate, formatDuration, formatYtDate, formatStreamTimeRange, calculateDeficit } from '../utils/helpers';
import { ConfirmBanner } from './Notification';
import { EditRunModal } from './modals/EditRunModal';
import { CrossfadeImage } from './common/UIComponents';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

export default function GameProfileModal({ 
  gameId, gameData, onClose, onStartWorkspace, onDeleteCycle, onDeleteTimestamp, onNotify, 
  systemFonts, modalBgIntensity, modalPanelOpacity, initialRunId = null, onUpdateCycle, onAddCycle, layoutPrefs 
}) {
  const [selectedCycleId, setSelectedCycleId] = useState(initialRunId);
  const [newCycleName, setNewCycleName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedLogIndex, setSelectedLogIndex] = useState(null);
  const [editingRun, setEditingRun] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const playlistRef = useRef([]);
  const indexRef = useRef(0);
  
  if (playlistRef.current.length === 0 && gameData && gameData.thumbnail_urls) {
    playlistRef.current = generateSingleGamePlaylist(gameData.thumbnail_urls);
  }

  const [bgImage, setBgImage] = useState(() => {
    return playlistRef.current.length > 0 
      ? playlistRef.current[0]
      : 'https://placehold.co/1280x720/1e293b/475569?text=No+Image';
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const intervalTime = layoutPrefs?.hoverCycleInterval || 1500;
    let interval;

    if (playlistRef.current.length > 1) {
      interval = setInterval(() => {
        let idx = indexRef.current + 1;
        
        if (idx >= playlistRef.current.length) {
          const lastImg = playlistRef.current[playlistRef.current.length - 1];
          playlistRef.current = generateSingleGamePlaylist(gameData.thumbnail_urls || [], lastImg);
          idx = 0;
        }
        
        indexRef.current = idx;
        setBgImage(playlistRef.current[idx]);
      }, intervalTime);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      clearInterval(interval);
    };
  }, [gameData, layoutPrefs?.hoverCycleInterval]);

  if (!gameData) return null;
  const cycles = gameData.cycles || {};
  const cycleEntries = Object.entries(cycles).map(([id, data]) => ({
    id,
    displayName: data.displayName || (id === 'main' ? 'First Playthrough' : id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    ...data
  }));
  const currentCycle = cycleEntries.find(c => c.id === selectedCycleId) || null;
  const currentCycleData = currentCycle ? cycles[currentCycle.id] : { stream_count: 0, timestamps: [] };
  const details = gameData.details || { developer: 'Unknown', publisher: 'Unknown', releaseDate: gameData.release_year, genres: 'Unknown', tags: 'Unknown', steamUrl: '' };

  const handleNext = () => {
    let finalCycleId = isCreatingNew && newCycleName ? newCycleName.toLowerCase().replace(/\s+/g, '_') : selectedCycleId;
    if (!finalCycleId && cycleEntries.length > 0) finalCycleId = cycleEntries[0].id;
    if (!finalCycleId) {
      onNotify('Please select or create a run first', 'error');
      return;
    }
    const selectedStreamNumber = selectedLogIndex !== null ? selectedLogIndex + 1 : null;
    onStartWorkspace(gameId, finalCycleId, selectedStreamNumber);
  };

  const renderTimestamps = () => {
    if (!currentCycle) return <div className="text-center text-white/50 py-12 text-sm">Select a run to view its logs</div>;
    if (!currentCycleData.timestamps?.length) return <div className="text-center text-white/30 py-12 text-sm">No logs yet</div>;
    
    const reversed = [...currentCycleData.timestamps].reverse();

    return reversed.map((ts, i) => {
      const realIdx = currentCycleData.timestamps.length - 1 - i;
      const active = selectedLogIndex === realIdx;

      return (
        <div 
          key={i} 
          onClick={() => setSelectedLogIndex(active ? null : realIdx)} 
          className={`p-3 rounded-xl border-2 transition-all cursor-pointer shrink-0 ${active ? 'border-blue-500 bg-black/60 shadow-lg' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <p className="font-medium" style={{ fontSize: `${systemFonts.logTitle}px` }}>Livestream #{realIdx + 1}</p>
                {ts.videoId && (
                  <a 
                    href={`https://youtube.com/watch?v=${ts.videoId}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition px-2 py-0.5 rounded text-[10px] text-white/70 hover:text-white border border-white/5" 
                    onClick={e => e.stopPropagation()}
                    title="Watch Video on YouTube"
                  >
                    <PlayCircle size={12} className="text-red-500" /> 
                    <span>{formatDuration(ts.duration)}</span>
                  </a>
                )}
              </div>
              <p className="text-white/40 mt-0.5" style={{ fontSize: `${systemFonts.logSub}px` }}>
                 {(() => {
                    if (ts.startTime && ts.endTime) {
                      const rangeStr = formatStreamTimeRange(ts.startTime, ts.endTime);
                      const deficit = calculateDeficit(ts.startTime, ts.endTime, ts.duration);
                      return `${rangeStr}${deficit}`;
                    }
                    if (ts.startTime) return formatYtDate(ts.startTime);
                    if (ts.date) return formatYtDate(ts.date);
                    return '';
                 })()}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDialog({ title: 'Delete Log Entry', message: `Delete Livestream #${realIdx + 1}?`, onConfirm: () => { onDeleteTimestamp(gameId, currentCycle.id, realIdx, ts); setConfirmDialog(null); } });
              }}
              className="text-red-400 hover:text-red-300 transition hover:scale-110 p-2"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      );
    });
  };

  const handleDeleteRun = (cycleId, displayName, streamCount) => {
    setConfirmDialog({
      title: 'Delete Run',
      message: `Delete run "${displayName}" from "${gameData.game_name}"? It has ${streamCount} livestream(s). This cannot be undone.`,
      onConfirm: () => {
        onDeleteCycle(gameId, cycleId);
        if (selectedCycleId === cycleId) setSelectedCycleId(null);
        setConfirmDialog(null);
      }
    });
  };

  const handleEditRun = (cycle) => {
    setEditingRun({
      id: cycle.id,
      displayName: cycle.displayName,
      isMain: cycle.isMain || false,
      youtubePlaylist: cycle.youtubePlaylist || '',
      label: cycle.label || 'Ongoing',
    });
  };

  const handleSaveRunEdit = (newDisplayName, isMain, playlist, newLabel, playlistData) => {
    onUpdateCycle(gameId, editingRun.id, newDisplayName, isMain, playlist, newLabel, playlistData);
    setEditingRun(null);
  };

  const handleCycleClick = (cycleId) => {
    if (selectedCycleId === cycleId) {
      setSelectedCycleId(null);
    } else {
      setSelectedCycleId(cycleId);
      setSelectedLogIndex(null);
    }
    setIsCreatingNew(false);
  };

  const handleCreateNewRun = () => {
    if (!newCycleName.trim()) return;
    const success = onAddCycle(gameId, newCycleName.trim());
    if (success) {
      setNewCycleName('');
      setIsCreatingNew(false);
    }
  };

  const getLabelStyle = (label) => {
    switch (label) {
      case 'Completed': return { bg: 'bg-yellow-600', icon: '✓', text: 'Completed' };
      case 'Abandoned': return { bg: 'bg-red-600', icon: '✗', text: 'Abandoned' };
      default: return { bg: 'bg-green-600', icon: '', text: 'Ongoing' };
    }
  };

  const blurAmount = modalBgIntensity * 40; 
  
  const panelStyle = { 
    backgroundColor: `rgba(0, 0, 0, ${modalPanelOpacity})`, 
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
  };

  const isLargeScreen = window.innerWidth > 1024;
  const leftWidth = isLargeScreen ? `${(layoutPrefs.modalSplitRatio || 0.6) * 100}%` : '100%';
  const rightWidth = isLargeScreen ? `${(1 - (layoutPrefs.modalSplitRatio || 0.6)) * 100}%` : '100%';

  return (
    <>
      <div className="fixed inset-0 z-[40] pointer-events-none overflow-hidden bg-black">
        <div className="absolute -inset-[100px] transform scale-110">
          <CrossfadeImage 
            src={bgImage} 
            className="w-full h-full" 
            imgClassName="object-cover" 
            style={{ filter: `blur(${blurAmount}px)` }} 
          />
          <div className="absolute inset-0 bg-black/50 z-10" />
        </div>
      </div>

      <div className="fixed inset-0 z-[50] overflow-y-auto lg:overflow-hidden custom-scrollbar" onClick={onClose}>
        <div className="min-h-full lg:h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div 
            className="relative w-full max-w-7xl flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-6 mx-auto cursor-auto lg:max-h-full" 
            onClick={e => e.stopPropagation()}
          >
            {/* Left Column */}
            <div className="flex flex-col rounded-2xl shadow-2xl overflow-hidden shrink-0 lg:min-h-0" style={{ ...panelStyle, width: leftWidth }}>
              <div className="relative shrink-0 aspect-video bg-black/40 border-b border-white/10">
                <CrossfadeImage src={bgImage} className="w-full h-full" imgClassName="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <h2 className="font-bold tracking-tight text-white drop-shadow-2xl" style={{ fontSize: `${systemFonts.modalHeader}px`, textShadow: '0 4px 12px rgba(0,0,0,0.9)' }}>
                    {gameData.game_name}
                  </h2>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full text-white lg:hidden border border-white/20">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar lg:min-h-0">
                <div className="space-y-3">
                  <div><span className="text-white/50 text-sm block">Developer</span><span className="text-white text-sm">{details.developer}</span></div>
                  <div><span className="text-white/50 text-sm block">Publisher</span><span className="text-white text-sm">{details.publisher}</span></div>
                  <div><span className="text-white/50 text-sm block">Release Date</span><span className="text-white text-sm">{formatReleaseDate(details.releaseDate)}</span></div>
                  <div><span className="text-white/50 text-sm block">Genres</span><span className="text-white text-sm">{details.genres}</span></div>
                  {details.tags && details.tags !== 'Unknown' && (
                    <div><span className="text-white/50 text-sm block">Tags</span><span className="text-white text-sm">{details.tags}</span></div>
                  )}
                  {details.steamUrl && (
                    <div>
                      <span className="text-white/50 text-sm block">Steam Page</span>
                      <a href={details.steamUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                        {details.steamUrl}
                      </a>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-white/10 pb-2">
                  <label className="text-white/50 text-sm block mb-2">YouTube Playlists</label>
                  <div className="space-y-1">
                    {cycleEntries.map(cycle => {
                      if (!cycle.youtubePlaylist) return null;
                      const link = cycle.youtubePlaylist.includes('http') ? cycle.youtubePlaylist : `https://youtube.com/playlist?list=${cycle.youtubePlaylist}`;
                      return (
                        <div key={cycle.id} className="flex items-center gap-2">
                          <Star size={12} className="text-yellow-500/60 shrink-0" />
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                            {cycle.displayName}
                          </a>
                        </div>
                      );
                    })}
                    {cycleEntries.every(c => !c.youtubePlaylist) && (
                      <span className="text-white/40 text-sm italic">No playlists added. Edit a run to add one.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-4 lg:gap-6 shrink-0 lg:min-h-0" style={{ width: rightWidth }}>
              
              {/* Runs Panel */}
              <div className="flex flex-col rounded-2xl shadow-xl overflow-hidden lg:flex-1 lg:min-h-0" style={panelStyle}>
                <div className="shrink-0 flex justify-between items-center p-4 border-b border-white/5">
                  <h3 className="text-sm font-semibold text-white/50 flex items-center gap-2"><Gamepad2 size={16} /> Runs</h3>
                  <div className="flex gap-2">
                    <button onClick={onClose} className="hidden lg:block bg-white/10 hover:bg-white/20 p-2 rounded-lg transition border border-white/10" title="Back">
                      <ArrowLeft size={16} />
                    </button>
                    <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition shadow-lg shadow-blue-500/20" title="Continue to thumbnail setup">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar p-4 pt-2 space-y-2 max-h-[350px] lg:max-h-none lg:flex-1 lg:min-h-0">
                  {cycleEntries.map(cycle => {
                    const streamCount = cycle.stream_count || 0;
                    const isSelected = selectedCycleId === cycle.id;
                    const labelInfo = getLabelStyle(cycle.label || 'Ongoing');
                    
                    // Total Runtime Pill
                    const runTimeSecs = cycle.timestamps?.reduce((acc, ts) => acc + (ts.duration || 0), 0) || 0;

                    return (
                      <div
                        key={cycle.id}
                        onClick={() => handleCycleClick(cycle.id)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer shrink-0 ${isSelected ? 'border-blue-500 bg-black/60 shadow-lg' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
                            <span className="font-medium text-white text-base sm:text-lg">{cycle.displayName}</span>
                            <span className={`${labelInfo.bg} text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shadow`}>
                              {labelInfo.icon && <span>{labelInfo.icon}</span>}
                              {labelInfo.text}
                            </span>
                          </div>
                          <div className="flex gap-1 sm:gap-2 ml-2 shrink-0">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditRun(cycle); }} 
                              className="p-1.5 text-blue-400 hover:text-blue-300 transition hover:scale-110 drop-shadow-md bg-white/5 hover:bg-white/10 rounded-md"
                              title="Edit run"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteRun(cycle.id, cycle.displayName, streamCount); }} 
                              className="p-1.5 text-red-400 hover:text-red-300 transition hover:scale-110 drop-shadow-md bg-white/5 hover:bg-white/10 rounded-md"
                              title="Delete run"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-md">
                              {streamCount} stream{streamCount === 1 ? '' : 's'}
                            </span>
                            {runTimeSecs > 0 && (
                              <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm border border-white/5">
                                <PlayCircle size={12} className="text-red-500" /> {formatDuration(runTimeSecs)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div onClick={() => setIsCreatingNew(true)} className={`p-4 rounded-xl border-2 border-dashed cursor-pointer shrink-0 transition ${isCreatingNew ? 'bg-purple-500/20 border-purple-500' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}>
                    <div className="flex items-center gap-2 text-sm font-medium"><Plus size={16} /> New Run</div>
                    {isCreatingNew && (
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <input 
                          type="text" 
                          placeholder="Run name (e.g., Speedrun)" 
                          value={newCycleName} 
                          onChange={(e) => setNewCycleName(e.target.value)}
                          className="flex-1 bg-black/60 border border-white/20 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                          autoFocus 
                          onClick={e => e.stopPropagation()} 
                        />
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCreateNewRun(); }}
                          className="bg-blue-600 hover:bg-blue-500 py-2 sm:py-0 px-4 rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20"
                        >
                          Create
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Logs Panel */}
              <div className="flex flex-col rounded-2xl shadow-xl overflow-hidden lg:flex-1 lg:min-h-0" style={panelStyle}>
                <h3 className="shrink-0 text-sm font-semibold text-white/50 flex items-center gap-2 p-4 border-b border-white/5"><Clock size={16} /> Session Logs</h3>
                <div className="overflow-y-auto custom-scrollbar p-4 pt-2 space-y-2 max-h-[350px] lg:max-h-none lg:flex-1 lg:min-h-0">
                  {renderTimestamps()}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {editingRun && (
        <EditRunModal
          runName={editingRun.displayName}
          isMain={editingRun.isMain}
          youtubePlaylist={editingRun.youtubePlaylist}
          currentLabel={editingRun.label}
          gameName={gameData.game_name}
          releaseYear={gameData.release_year}
          existingTimestamps={gameData.cycles[editingRun.id]?.timestamps || []}
          onSave={handleSaveRunEdit}
          onClose={() => setEditingRun(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmBanner
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </>
  );
}