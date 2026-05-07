import React, { useState } from 'react';
import { Search, Clock, SortAsc, SortDesc, Maximize, Trash2, Edit3 } from 'lucide-react';
import { isLocalPath, parseCustomTimestamp } from '../utils/helpers';
import { ConfirmBanner } from './Notification';
import { EditGameModal } from './modals/EditGameModal';

export default function Library({ streamData, openGameProfile, onDeleteGame, onUpdateGameLink, onEditGame, systemFonts, layoutPrefs }) {
  const [sortBy, setSortBy] = useState('recent');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const games = Object.entries(streamData).map(([id, data]) => {
    const cycles = data.cycles || {};
    const totalStreams = Object.values(cycles).reduce((acc, c) => acc + (c.stream_count || 0), 0);
    const lastStreamDate = Object.values(cycles).reduce((latest, c) => {
      if (!c.timestamps || c.timestamps.length === 0) return latest;
      const d = parseCustomTimestamp(c.timestamps[c.timestamps.length - 1]);
      return d > latest ? d : latest;
    }, new Date(0));
    return { id, ...data, totalStreams, lastStreamDate };
  });

  const filtered = games.filter(g => g.game_name?.toLowerCase().includes(searchFilter.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alpha') return a.game_name.localeCompare(b.game_name);
    if (sortBy === 'recent') return b.lastStreamDate - a.lastStreamDate;
    if (sortBy === 'high') return b.totalStreams - a.totalStreams;
    if (sortBy === 'low') return a.totalStreams - b.totalStreams;
    return 0;
  });

  const handleEditClick = (game) => setEditingGame(game);
  const handleSaveEdit = (id, newName, newYear, rawgId) => onEditGame(id, newName, newYear, rawgId);

  const containerStyle = {
    paddingLeft: `${layoutPrefs.containerPaddingX}px`,
    paddingRight: `${layoutPrefs.containerPaddingX}px`,
    paddingTop: `${layoutPrefs.containerPaddingY}px`,
    paddingBottom: `${layoutPrefs.containerPaddingY}px`,
  };

  const cardStyle = {
    borderRadius: layoutPrefs.cardRounded ? `${layoutPrefs.cardRadius}px` : '0px',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-6 pt-6 pb-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input type="text" placeholder="Filter games..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
          {[
            { id: 'recent', label: 'Recent', icon: Clock },
            { id: 'alpha', label: 'A-Z', icon: SortAsc },
            { id: 'high', label: 'Most', icon: Maximize },
            { id: 'low', label: 'Least', icon: SortDesc }
          ].map(opt => (
            <button key={opt.id} onClick={() => setSortBy(opt.id)} className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${sortBy === opt.id ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}>
              <opt.icon size={14} /> {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar" style={containerStyle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {sorted.map(game => {
            const cover = game.thumbnail_urls?.[0] || 'https://placehold.co/600x400/1e293b/475569?text=Cover';
            return (
              <div
                key={game.id}
                onClick={() => openGameProfile(game.id)}
                className="group relative cursor-pointer transition-transform duration-200 hover:scale-105 overflow-hidden"
                style={cardStyle}
              >
                <div className="aspect-video overflow-hidden">
                  <img src={cover} alt={game.game_name} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg tracking-tight break-words" style={{ fontSize: `${systemFonts.libTitle}px` }}>{game.game_name}</h3>
                  <p className="text-white/40 text-sm mt-1" style={{ fontSize: `${systemFonts.libYear}px` }}>{game.release_year}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{game.totalStreams} streams</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditClick(game); }}
                    className="p-1.5 rounded-full bg-blue-500/80 text-white hover:bg-blue-600"
                    title="Edit game details"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation();
                      setConfirmDialog({
                        title: 'Delete Game',
                        message: `Delete "${game.game_name}"? It has ${game.totalStreams} livestream(s) across ${Object.keys(game.cycles).length} run(s). This cannot be undone.`,
                        onConfirm: () => {
                          onDeleteGame(game.id, game.game_name);
                          setConfirmDialog(null);
                        }
                      });
                    }}
                    className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600"
                    title="Delete game"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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