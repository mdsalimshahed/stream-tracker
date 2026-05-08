import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Gamepad2, Clock, Plus, Trash2, Edit3, Save, Star, ExternalLink, Check, Pencil } from 'lucide-react';
import { formatRunName, formatReleaseDate } from '../utils/helpers';
import { ConfirmBanner } from './Notification';
import { EditRunModal } from './modals/EditRunModal';
import { CrossfadeImage } from './common/UIComponents';

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
  const [bgImageIndex, setBgImageIndex] = useState(0);
  const [bgImages, setBgImages] = useState([]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const images = gameData.thumbnail_urls?.filter(url => !url.startsWith('blob:') && url.startsWith('http')) || [];
    setBgImages(images);
    
    const intervalTime = layoutPrefs?.cycleInterval || 4000;
    const interval = setInterval(() => {
      if (images.length) setBgImageIndex(prev => (prev + 1) % images.length);
    }, intervalTime);
    
    return () => {
      document.body.style.overflow = 'unset';
      clearInterval(interval);
    };
  }, [gameData, layoutPrefs?.cycleInterval]);

  if (!gameData) return null;
  const cycles = gameData.cycles || {};
  const cycleEntries = Object.entries(cycles).map(([id, data]) => ({
    id,
    displayName: data.displayName || (id === 'main' ? 'First Playthrough' : id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    ...data
  }));
  const currentCycle = cycleEntries.find(c => c.id === selectedCycleId) || null;
  const currentCycleData = currentCycle ? cycles[currentCycle.id] : { stream_count: 0, timestamps: [] };
  const details = gameData.details || { developer: 'Unknown', publisher: 'Unknown', releaseDate: gameData.release_year, genres: 'Unknown', tags: 'Unknown' };

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

  const handleBack = () => {
    onClose();
  };

  const renderTimestamps = () => {
    if (!currentCycle) {
      return <div className="text-center text-white/50 py-12 text-sm">Select a run to view its logs</div>;
    }
    if (!currentCycleData.timestamps?.length) {
      return <div className="text-center text-white/30 py-12 text-sm">No logs yet</div>;
    }
    const reversed = [...currentCycleData.timestamps].reverse();
    return reversed.map((ts, i) => {
      const realIdx = currentCycleData.timestamps.length - 1 - i;
      const active = selectedLogIndex === realIdx;
      const runName = currentCycle.displayName;
      return (
        <div 
          key={i} 
          onClick={() => setSelectedLogIndex(active ? null : realIdx)} 
          className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${active ? 'border-blue-500 bg-black/60 shadow-lg' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium" style={{ fontSize: `${systemFonts.logTitle}px` }}>Livestream #{realIdx + 1}</p>
              <p className="text-white/40 mt-0.5" style={{ fontSize: `${systemFonts.logSub}px` }}>{ts}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDialog({
                  title: 'Delete Log Entry',
                  message: `Delete Livestream #${realIdx + 1} for "${runName}" run of "${gameData.game_name}"? This cannot be undone.`,
                  onConfirm: () => {
                    onDeleteTimestamp(gameId, currentCycle.id, realIdx, ts);
                    setConfirmDialog(null);
                  }
                });
              }}
              className="text-red-400 hover:text-red-300 transition hover:scale-110"
            >
              <Trash2 size={14} />
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
      label: cycle.label || 'Ongoing'
    });
  };

  const handleSaveRunEdit = (newDisplayName, isMain, playlist, newLabel) => {
    onUpdateCycle(gameId, editingRun.id, newDisplayName, isMain, playlist, newLabel);
    onNotify('Run updated successfully', 'success');
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

  const bgImage = bgImages[bgImageIndex] || 'https://placehold.co/1280x720/1e293b/475569?text=No+Image';
  const blurAmount = 8 + (1 - modalBgIntensity) * 24; // Dynamic heavy blur
  
  const panelStyle = { 
    backgroundColor: `rgba(0, 0, 0, ${modalPanelOpacity})`, 
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
    borderRadius: '1rem'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden" onClick={onClose}>
      
      {/* Scaled-Blur Modal Background Fix */}
      <div className="absolute -inset-[80px] -z-10 pointer-events-none transform scale-110">
        <div className="absolute inset-0 bg-black/80 z-10" style={{ opacity: 1 - modalBgIntensity }} />
        <CrossfadeImage 
          src={bgImage} 
          className="w-full h-full" 
          imgClassName="object-cover" 
          style={{ filter: `blur(${blurAmount}px)`, opacity: modalBgIntensity }} 
        />
      </div>

      <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col lg:flex-row gap-6 mx-auto p-1" onClick={e => e.stopPropagation()}>
        
        {/* LEFT COLUMN: Game Information */}
        <div className="lg:w-1/2 flex flex-col overflow-hidden rounded-2xl" style={panelStyle}>
          <div className="relative aspect-video rounded-t-2xl overflow-hidden bg-black/40 border-b border-white/10">
            <CrossfadeImage src={bgImage} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <h2 className="font-bold tracking-tight text-white drop-shadow-2xl" style={{ fontSize: `${systemFonts.modalHeader + 4}px`, textShadow: '0 4px 12px rgba(0,0,0,0.9)' }}>
                {gameData.game_name}
              </h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            <div className="space-y-3">
              <div><span className="text-white/50 text-sm block">Developer</span><span className="text-white text-sm">{details.developer}</span></div>
              <div><span className="text-white/50 text-sm block">Publisher</span><span className="text-white text-sm">{details.publisher}</span></div>
              <div><span className="text-white/50 text-sm block">Release Date</span><span className="text-white text-sm">{formatReleaseDate(details.releaseDate)}</span></div>
              <div><span className="text-white/50 text-sm block">Genres</span><span className="text-white text-sm">{details.genres}</span></div>
              {details.tags && details.tags !== 'Unknown' && (
                <div><span className="text-white/50 text-sm block">Tags</span><span className="text-white text-sm">{details.tags}</span></div>
              )}
            </div>
            <div className="pt-3 border-t border-white/10">
              <label className="text-white/50 text-sm block mb-2">YouTube Playlists</label>
              <div className="space-y-1">
                {cycleEntries.map(cycle => {
                  const playlist = cycle.youtubePlaylist;
                  if (!playlist) return null;
                  return (
                    <div key={cycle.id} className="flex items-center gap-2">
                      <Star size={12} className="text-yellow-500/60" />
                      <a href={playlist} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">
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

        {/* RIGHT COLUMN: Runs and Logs */}
        <div className="lg:w-1/2 flex flex-col gap-6 h-full min-h-0">
          
          {/* Runs panel */}
          <div className="flex flex-col rounded-2xl overflow-hidden flex-1 min-h-0" style={panelStyle}>
            <div className="flex justify-between items-center p-4 pb-0 shrink-0">
              <h3 className="text-sm font-semibold text-white/50 flex items-center gap-2"><Gamepad2 size={16} /> Runs</h3>
              <div className="flex gap-2">
                <button onClick={handleBack} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition border border-white/10" title="Back">
                  <ArrowLeft size={16} />
                </button>
                <button onClick={handleNext} className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition shadow-lg shadow-blue-500/20" title="Continue to thumbnail setup">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-2 space-y-2">
              {cycleEntries.map(cycle => {
                const streamCount = cycle.stream_count || 0;
                const isSelected = selectedCycleId === cycle.id;
                const labelInfo = getLabelStyle(cycle.label || 'Ongoing');
                return (
                  <div
                    key={cycle.id}
                    onClick={() => handleCycleClick(cycle.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-black/60 shadow-lg' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium text-white text-lg">{cycle.displayName}</span>
                        <span className={`${labelInfo.bg} text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shadow`}>
                          {labelInfo.icon && <span>{labelInfo.icon}</span>}
                          {labelInfo.text}
                        </span>
                      </div>
                      <div className="flex gap-2">
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
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-md">{streamCount} streams</span>
                    </div>
                  </div>
                );
              })}
              
              <div onClick={() => setIsCreatingNew(true)} className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition ${isCreatingNew ? 'bg-purple-500/20 border-purple-500' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}>
                <div className="flex items-center gap-2 text-sm font-medium"><Plus size={16} /> New Run</div>
                {isCreatingNew && (
                  <div className="mt-3 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Run name (e.g., Speedrun, NG+)" 
                      value={newCycleName} 
                      onChange={(e) => setNewCycleName(e.target.value)}
                      className="flex-1 bg-black/60 border border-white/20 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                      autoFocus 
                      onClick={e => e.stopPropagation()} 
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCreateNewRun(); }}
                      className="bg-blue-600 hover:bg-blue-500 px-4 rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20"
                    >
                      Create
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logs panel */}
          <div className="flex flex-col rounded-2xl overflow-hidden flex-1 min-h-0" style={panelStyle}>
            <h3 className="text-sm font-semibold text-white/50 flex items-center gap-2 p-4 pb-0 shrink-0"><Clock size={16} /> Session Logs</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-2 space-y-2">
              {renderTimestamps()}
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
    </div>
  );
}