import React, { useState } from 'react';
import { Clock, SortAsc, Maximize, Layout, Trash2 } from 'lucide-react';
import { parseCustomTimestamp, isLocalPath } from '../utils/helpers';

const SortBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`px-4 py-2 text-[10px] font-bold flex items-center gap-2 transition-all ${active ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
    {icon} {label}
  </button>
);

const Library = ({ streamData, openGameProfile, onDeleteGame }) => {
  const [sortBy, setSortBy] = useState('recent');

  const games = Object.entries(streamData).map(([id, data]) => {
    const totalStreams = Object.values(data.cycles || {}).reduce((acc, c) => acc + (c.stream_count || 0), 0);
    const lastStreamDate = Object.values(data.cycles || {}).reduce((latest, c) => {
      if (!c.timestamps || c.timestamps.length === 0) return latest;
      const d = parseCustomTimestamp(c.timestamps[c.timestamps.length - 1]);
      return d > latest ? d : latest;
    }, new Date(0));

    return { id, ...data, totalStreams, lastStreamDate };
  });

  const sortedGames = [...games].sort((a, b) => {
    if (sortBy === 'alpha') return a.game_name.localeCompare(b.game_name);
    if (sortBy === 'recent') return b.lastStreamDate - a.lastStreamDate;
    if (sortBy === 'high') return b.totalStreams - a.totalStreams;
    if (sortBy === 'low') return a.totalStreams - b.totalStreams;
    return 0;
  });

  return (
    <div className="max-w-full mx-auto p-8 animate-in fade-in font-arial h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <h2 className="text-3xl font-bold text-white tracking-tight">Database</h2>
        <div className="flex bg-slate-800 p-1 border border-slate-700 rounded shadow-inner">
          <SortBtn active={sortBy === 'recent'} onClick={() => setSortBy('recent')} icon={<Clock size={14}/>} label="Recent" />
          <SortBtn active={sortBy === 'alpha'} onClick={() => setSortBy('alpha')} icon={<SortAsc size={14}/>} label="A-Z" />
          <SortBtn active={sortBy === 'high'} onClick={() => setSortBy('high')} icon={<Maximize size={14}/>} label="Top" />
          <SortBtn active={sortBy === 'low'} onClick={() => setSortBy('low')} icon={<Layout size={14}/>} label="Low" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-8">
          {sortedGames.map(game => {
            const cover = game.thumbnail_urls?.find(url => !isLocalPath(url)) || '[https://placehold.co/600x400/1e293b/475569?text=Game](https://placehold.co/600x400/1e293b/475569?text=Game)';
            return (
              <div key={game.id} className="bg-slate-900 border border-slate-800 hover:border-blue-600 cursor-pointer group transition-all relative shadow-2xl flex flex-col h-[400px]">
                <div onClick={() => openGameProfile(game.id)} className="flex-1 bg-slate-950 overflow-hidden text-center">
                   <img src={cover} alt={game.game_name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                   <div className="absolute top-4 right-4 bg-black text-white text-[11px] font-bold px-2 py-1 tracking-tighter ring-1 ring-white/10 shadow-2xl">{game.totalStreams} S</div>
                </div>
                <div className="p-6 shrink-0 bg-slate-900" onClick={() => openGameProfile(game.id)}>
                  <h3 className="font-bold text-white text-lg tracking-tight mb-2 truncate" title={game.game_name}>{game.game_name}</h3>
                  <p className="text-xs text-slate-500 font-bold">{game.release_year}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDeleteGame(game.id, game.game_name); }} className="absolute bottom-6 right-6 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 opacity-0 group-hover:opacity-100 hover:text-white transition-all ring-1 ring-red-500/20"><Trash2 size={20} /></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Library;
