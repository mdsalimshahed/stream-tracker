import React, { useState, useEffect } from 'react';
import { parseCustomTimestamp } from '../utils/helpers';
import { CrossfadeImage } from './common/UIComponents';

export default function Dashboard({ streamData, openGameProfile, systemFonts, layoutPrefs, globalImage, hoverState, onHoverGame }) {
  const [recentStreams, setRecentStreams] = useState([]);

  useEffect(() => {
    const recent = [];
    Object.entries(streamData).forEach(([appId, game]) => {
      Object.entries(game.cycles || {}).forEach(([cycleName, cycleData]) => {
        const timestamps = cycleData.timestamps || [];
        if (timestamps.length > 0) {
          recent.push({
            appId,
            gameName: game.game_name,
            releaseYear: game.release_year,
            cycleName,
            count: cycleData.stream_count,
            lastTimeStr: timestamps[timestamps.length - 1],
            lastTimeDate: parseCustomTimestamp(timestamps[timestamps.length - 1]),
            cover: game.thumbnail_urls?.[0] || 'https://placehold.co/600x400/1e293b/475569?text=Cover',
            allThumbnails: game.thumbnail_urls || [],
            cycleDisplayName: cycleData.displayName || (cycleName === 'main' ? 'First Playthrough' : cycleName.replace(/_/g, ' '))
          });
        }
      });
    });
    recent.sort((a, b) => b.lastTimeDate - a.lastTimeDate);
    setRecentStreams(recent.slice(0, 15));
  }, [streamData]);

  const containerStyle = {
    paddingLeft: `clamp(16px, ${layoutPrefs.containerPaddingX}px, 5vw)`,
    paddingRight: `clamp(16px, ${layoutPrefs.containerPaddingX}px, 5vw)`,
    paddingTop: `clamp(16px, ${layoutPrefs.containerPaddingY}px, 5vh)`,
    paddingBottom: `clamp(16px, ${layoutPrefs.containerPaddingY}px, 5vh)`,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: window.innerWidth > 768 
      ? `repeat(${layoutPrefs.cardsPerRow || 5}, 1fr)` 
      : 'repeat(auto-fill, minmax(160px, 1fr))',
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
    <div className="overflow-y-auto h-full custom-scrollbar" style={containerStyle}>
      {recentStreams.length === 0 && (
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-8 sm:p-12 text-center text-white/60 shadow-lg max-w-2xl mx-auto">
          No streams recorded yet. Add a game and start a session.
        </div>
      )}
      
      <div style={gridStyle}>
        {recentStreams.map((stream) => {
          const uniqueCardId = `${stream.appId}-${stream.cycleName}`;
          const isHovered = hoverState.cardId === uniqueCardId;
          const activeImg = (isHovered && stream.allThumbnails.includes(globalImage)) ? globalImage : stream.cover;

          return (
            <div
              key={uniqueCardId}
              onClick={() => openGameProfile(stream.appId, stream.cycleName)}
              onMouseEnter={() => onHoverGame(uniqueCardId, stream.appId)}
              onMouseLeave={() => onHoverGame(null, null)}
              className="group cursor-pointer overflow-hidden shadow-xl flex flex-col"
              style={cardStyle}
            >
              <div className="relative overflow-hidden aspect-video bg-black/40 shrink-0">
                <CrossfadeImage 
                  src={activeImg} 
                  alt={stream.gameName} 
                  className="absolute inset-0 w-full h-full" 
                  imgClassName="object-cover group-hover:scale-110" 
                />
                <div className="absolute bottom-2 right-2 bg-blue-600/80 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold text-white pointer-events-none shadow z-20">
                  Resume
                </div>
              </div>
              <div className="p-3 flex flex-col flex-1" style={{ padding: `clamp(12px, ${layoutPrefs.cardPadding}px, 20px)` }}>
                <h3 className="font-bold text-white leading-tight break-words drop-shadow-md" style={{ fontSize: `${systemFonts.libTitle}px` }}>
                  {stream.gameName}
                </h3>
                <p className="text-white/80 mt-1 drop-shadow-md mb-auto" style={{ fontSize: `${systemFonts.libYear}px` }}>
                  {stream.cycleDisplayName} • Session #{stream.count}
                </p>
                <p className="text-white/50 text-[10px] mt-3 font-mono drop-shadow-md hidden min-[400px]:block">{stream.lastTimeStr}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}