// src/components/SearchView.jsx
import React from 'react';
import { Search, Loader2, Plus } from 'lucide-react';

export default function SearchView({ searchQuery, setSearchQuery, searchResults, isSearching, handleSearch, handleAddGame, streamData, scaledSystemFonts, scaledLayoutPrefs }) {
  const containerStyle = {
    paddingLeft: `clamp(16px, ${scaledLayoutPrefs.containerPaddingX}px, 5vw)`,
    paddingRight: `clamp(16px, ${scaledLayoutPrefs.containerPaddingX}px, 5vw)`,
    paddingTop: `clamp(16px, ${scaledLayoutPrefs.containerPaddingY}px, 5vh)`,
    paddingBottom: `clamp(16px, ${scaledLayoutPrefs.containerPaddingY}px, 5vh)`,
  };
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${scaledLayoutPrefs.cardMaxWidth || 250}px), 1fr))`,
    gap: `${scaledLayoutPrefs.cardGap}px`,
  };
  const cardStyle = {
    borderRadius: scaledLayoutPrefs.cardRounded ? `${scaledLayoutPrefs.cardRadius}px` : '0px',
    backgroundColor: `rgba(0, 0, 0, ${scaledLayoutPrefs.panelFillOpacity ?? 0.1})`,
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.2s',
    width: '100%',
    margin: '0 auto',
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
            placeholder="Search for any game and then press enter."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 peer-focus:opacity-100 transition-opacity duration-300 z-20 pointer-events-none" />
          {isSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-blue-400 z-10" size={22} />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={containerStyle}>
        <div style={gridStyle}>
          {searchResults.map(g => {
            const isInLibrary = Object.values(streamData).some(e => e.game_name?.toLowerCase() === g.name?.toLowerCase()) || !!streamData[g.id.toString()];
            return (
              <div key={g.id} className="group relative overflow-hidden shadow-xl flex flex-col transition-all duration-300 delay-0 hover:scale-105 hover:shadow-2xl hover:z-10 hover:delay-300" style={cardStyle}>
                <div className="aspect-video bg-black/40 overflow-hidden relative shrink-0">
                  <img src={g.cover_image || 'https://placehold.co/600x400/1e293b/475569?text=Cover'} alt={g.name} className="absolute inset-0 w-full h-full object-cover" />
                  
                  {/* Source Indicators */}
                  {g.source === 'RAWG' && <span className="absolute top-2 right-2 bg-purple-600/80 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full z-20 shadow">RAWG</span>}
                  {g.source === 'STEAM' && <span className="absolute top-2 right-2 bg-blue-600/80 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full z-20 shadow">STEAM</span>}
                  
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
                </div>
                <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between" style={{ padding: `clamp(12px, ${scaledLayoutPrefs.cardPadding}px, 20px)` }}>
                  <h3 className="font-bold tracking-tight drop-shadow-md group-hover:text-[#e8c87a] transition-colors duration-300" style={{ fontSize: `${scaledSystemFonts.libTitle}px` }}>{g.name}</h3>
                  {isInLibrary
                    ? <div className="mt-4 w-full bg-white/5 py-2 rounded-none font-medium flex items-center justify-center text-white/50 cursor-not-allowed border border-white/5">Already in Library</div>
                    : <button onClick={() => handleAddGame(g)} className="mt-4 w-full bg-white/10 hover:bg-white/20 active:scale-95 py-2 rounded-none font-medium flex items-center justify-center gap-2 transition-all border border-white/10"><Plus size={18} /> Add to Library</button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}