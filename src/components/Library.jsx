// src/components/Library.jsx
import React, { useState, useRef } from 'react';
import { Search, Clock, SortAsc, SortDesc, Maximize, Trash2, Edit3, PlayCircle } from 'lucide-react';
import { parseCustomTimestamp, getLowResUrl, formatDuration } from '../utils/helpers';
import { ConfirmBanner } from './Notification';
import { EditGameModal } from './modals/EditGameModal';
import { CrossfadeImage, MasonryLayout } from './common/UIComponents';

const getLatestRun = (cycles) => {
  let latestRun = null;
  let latestDate = null;
  Object.values(cycles).forEach(run => {
    const timestamps = run.timestamps || [];
    if (timestamps.length > 0) {
      const lastTimestamp = timestamps[timestamps.length - 1];
      const date = new Date(lastTimestamp);
      if (!latestDate || date > latestDate) {
        latestDate = date;
        latestRun = run;
      }
    } else if (!latestDate && run.stream_count > 0) {
      latestRun = run;
    }
  });
  return latestRun;
}

export default function Library({ streamData, handleCardClick, onDeleteGame, onUpdateGameLink, onEditGame, systemFonts, layoutPrefs, hoveredImage, hoverState, onHoverGame, onImportDefault, hasCustomSettings }) {
  const [sortBy, setSortBy] = useState('recent');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  const scrollRef = useRef(null);

  const games = Object.entries(streamData).map(([id, data]) => {
    const cycles = data.cycles || {};
    const totalStreams = Object.values(cycles).reduce((acc, c) => acc + Number(c.stream_count || 0), 0);
    const totalDuration = Object.values(cycles).reduce((acc, c) => {
      return acc + (c.timestamps?.reduce((sum, ts) => sum + (ts.duration || 0), 0) || 0);
    }, 0);
    
    const lastStreamDate = Object.values(cycles).reduce((latest, c) => {
      if (!c.timestamps || c.timestamps.length === 0) return latest;
      const d = parseCustomTimestamp(c.timestamps[c.timestamps.length - 1]);
      return d > latest ? d : latest;
    }, new Date(0));
    const latestRun = getLatestRun(cycles);
    const label = latestRun?.label || 'Ongoing';
    return { id, ...data, totalStreams, totalDuration, lastStreamDate, label };
  });

  const filtered = games.filter(g => g.game_name?.toLowerCase().includes(searchFilter.toLowerCase()));
  
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alpha') return a.game_name.localeCompare(b.game_name);
    if (sortBy === 'recent') return b.lastStreamDate - a.lastStreamDate;
    if (sortBy === 'high') {
      if (b.totalStreams !== a.totalStreams) return b.totalStreams - a.totalStreams;
      return b.lastStreamDate - a.lastStreamDate;
    }
    if (sortBy === 'low') {
      if (a.totalStreams !== b.totalStreams) return a.totalStreams - b.totalStreams;
      return b.lastStreamDate - a.lastStreamDate;
    }
    return 0;
  });

  const handleSortClick = (newSort) => {
    if (sortBy === newSort) return;
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    setSortBy(newSort);
  };

  const handleEditClick = (game) => setEditingGame(game);
  
  const handleSaveEdit = (id, newName, newYear, developer, publisher, genres, tags, steamIdToSync, steamUrl, notOnSteam) => 
    onEditGame(id, newName, newYear, developer, publisher, genres, tags, steamIdToSync, steamUrl, notOnSteam);

  const containerStyle = {
    paddingLeft: `clamp(16px, ${layoutPrefs.containerPaddingX}px, 5vw)`,
    paddingRight: `clamp(16px, ${layoutPrefs.containerPaddingX}px, 5vw)`,
    paddingTop: `clamp(16px, ${layoutPrefs.containerPaddingY}px, 5vh)`,
    paddingBottom: `clamp(16px, ${layoutPrefs.containerPaddingY}px, 5vh)`,
  };

  const cardStyle = {
    borderRadius: layoutPrefs.cardRounded ? `${layoutPrefs.cardRadius}px` : '0px',
    backgroundColor: `rgba(0, 0, 0, ${layoutPrefs.panelFillOpacity ?? 0.1})`,
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  const getLabelStyle = (label) => {
    switch (label) {
      case 'Completed': return { bg: 'bg-yellow-600', icon: '✓', text: 'Completed' };
      case 'Abandoned': return { bg: 'bg-red-600', icon: '✗', text: 'Abandoned' };
      default: return { bg: 'bg-green-600', icon: '', text: 'Ongoing' };
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {Object.keys(streamData).length === 0 ? (
        <div className="overflow-y-auto h-full custom-scrollbar flex flex-col" style={containerStyle}>
          <div className="flex flex-col items-center pt-16 sm:pt-24 w-full">
            <div className="bg-black/40 backdrop-blur-md rounded-xl p-8 sm:p-12 text-center text-white/60 shadow-lg max-w-2xl w-full flex flex-col items-center gap-5 border border-white/5">
              <p className="text-lg text-white/80">There is no stream data to show here. Would you like to import default data?</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button onClick={() => onImportDefault('full')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-lg whitespace-nowrap">
                  Import Stream Data + Settings
                </button>
                {!hasCustomSettings && (
                  <button onClick={() => onImportDefault('settings')} className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-lg border border-white/10 whitespace-nowrap">
                    Import Settings Only
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center relative z-10">
            <div className="relative w-full sm:w-80 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="text" 
                placeholder="Filter games..." 
                value={searchFilter} 
                onChange={(e) => setSearchFilter(e.target.value)} 
                className="w-full bg-black/60 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-yellow-500 shadow-inner text-white transition-colors" 
              />
            </div>
            <div className="flex w-full sm:w-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-1 gap-1 shadow-inner overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'recent', label: 'Recent', icon: Clock },
                { id: 'alpha', label: 'A-Z', icon: SortAsc },
                { id: 'high', label: 'Most', icon: Maximize },
                { id: 'low', label: 'Least', icon: SortDesc }
              ].map(opt => (
                <button key={opt.id} onClick={() => handleSortClick(opt.id)} className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium flex items-center justify-center gap-1.5 transition whitespace-nowrap ${sortBy === opt.id ? 'bg-white/20 text-white shadow' : 'text-white/60 hover:text-white'}`}>
                  <opt.icon size={14} /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar" style={containerStyle}>
            <MasonryLayout
              items={sorted}
              columnWidth={layoutPrefs.cardMaxWidth || 250}
              gap={layoutPrefs.cardGap}
              getItemId={(game) => game.id}
              enableAnimations={layoutPrefs.enableViewTransitions !== false}
              renderItem={(game) => {
                const isHovered = hoverState.cardId === game.id;
                const labelInfo = getLabelStyle(game.label);
                const isImageReady = hoveredImage?.gameId === game.id;
                const displayImg = (isHovered && isImageReady && hoveredImage?.url) ? hoveredImage.url : getLowResUrl(game.cover_image || game.thumbnail_urls?.[0], layoutPrefs.highResImages);

                return (
                  <div
                    onClick={(e) => handleCardClick(e, game.id, game.id)}
                    onMouseEnter={() => onHoverGame(game.id, game.id)}
                    onMouseLeave={() => onHoverGame(null, null)}
                    className={`group relative cursor-pointer overflow-hidden ${
                      isHovered 
                        ? 'scale-105 shadow-2xl z-20 border-white/20' 
                        : 'shadow-xl hover:scale-105 hover:shadow-2xl hover:z-10 hover:delay-300 delay-0'
                    }`}
                    style={cardStyle}
                  >
                    <div className="aspect-video overflow-hidden bg-black/40 relative shrink-0">
                      <CrossfadeImage 
                        src={displayImg} 
                        alt={game.game_name} 
                        className="absolute inset-0 w-full h-full" 
                        imgClassName="object-cover" 
                      />
                      <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent transition-opacity duration-300 z-30 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </div>
                    <div className="p-3 sm:p-4 flex flex-col flex-1" style={{ padding: `clamp(12px, ${layoutPrefs.cardPadding}px, 20px)` }}>
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <h3 className={`font-bold tracking-tight break-words flex-1 drop-shadow-md transition-colors duration-300 ${isHovered ? 'text-[#e8c87a]' : 'group-hover:text-[#e8c87a]'}`} style={{ fontSize: `${systemFonts.libTitle}px` }}>{game.game_name}</h3>
                      </div>
                      <p className="text-white/80 mt-1 drop-shadow-md" style={{ fontSize: `${systemFonts.libYear}px` }}>
                        {game.details?.developer || 'Unknown Developer'}
                      </p>
                      <p className="text-white/60 mt-1 mb-auto" style={{ fontSize: `${Math.max(10, systemFonts.libYear - 2)}px` }}>{game.release_year}</p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-2 items-center flex-wrap">
                          {game.totalDuration > 0 && (
                            <span className="text-[10px] sm:text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1 shadow z-20 text-white">
                              <PlayCircle size={10} className="text-red-400" /> {formatDuration(game.totalDuration)}
                            </span>
                          )}
                          <span className="text-[10px] sm:text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full shadow z-20">
                            {game.totalStreams} stream{game.totalStreams === 1 ? '' : 's'}
                          </span>
                          <span className={`${labelInfo.bg} text-white text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shadow z-20`}>
                            {labelInfo.icon && <span>{labelInfo.icon}</span>}
                            {labelInfo.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`absolute top-2 right-2 flex flex-col gap-1 transition z-30 ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditClick(game); }}
                        className="p-1.5 rounded-full bg-blue-500/80 backdrop-blur text-white hover:bg-blue-600 shadow"
                        title="Edit game details"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation();
                          setConfirmDialog({
                            title: 'Delete Game',
                            message: `Delete "${game.game_name}"? It has ${game.totalStreams} livestream(s). This cannot be undone.`,
                            onConfirm: () => {
                              onDeleteGame(game.id, game.game_name);
                              setConfirmDialog(null);
                            }
                          });
                        }}
                        className="p-1.5 rounded-full bg-red-500/80 backdrop-blur text-white hover:bg-red-600 shadow"
                        title="Delete game"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </>
      )}

      {editingGame && (
        <EditGameModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={handleSaveEdit}
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