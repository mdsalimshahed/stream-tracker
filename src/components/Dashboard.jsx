// src/components/Dashboard.jsx
import React, { useMemo } from 'react';
import { parseCustomTimestamp, getLowResUrl } from '../utils/helpers';
import { CrossfadeImage, MasonryLayout } from './common/UIComponents';

export default function Dashboard({ streamData, handleCardClick, systemFonts, layoutPrefs, hoveredImage, hoverState, onHoverGame, onImportDefault, hasCustomSettings }) {
  
  const recentStreams = useMemo(() => {
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
            cover: getLowResUrl(game.cover_image || game.thumbnail_urls?.[0] || 'https://placehold.co/600x400/1e293b/475569?text=Cover', layoutPrefs.highResImages),
            allThumbnails: game.thumbnail_urls || [],
            cycleDisplayName: cycleData.displayName || (cycleName === 'main' ? 'First Playthrough' : cycleName.replace(/_/g, ' '))
          });
        }
      });
    });
    recent.sort((a, b) => b.lastTimeDate - a.lastTimeDate);
    return recent.slice(0, 15);
  }, [streamData, layoutPrefs.highResImages]);

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

  return (
    <div className="overflow-y-auto h-full custom-scrollbar flex flex-col" style={containerStyle}>
      {Object.keys(streamData).length === 0 ? (
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
      ) : recentStreams.length === 0 ? (
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-8 sm:p-12 text-center text-white/60 shadow-lg max-w-2xl mx-auto mt-10 border border-white/5">
          No streams recorded yet. Add a game and start a session.
        </div>
      ) : (
        <MasonryLayout
          items={recentStreams}
          columnWidth={layoutPrefs.cardMaxWidth || 250}
          gap={layoutPrefs.cardGap}
          getItemId={(stream) => `${stream.appId}-${stream.cycleName}`}
          enableAnimations={layoutPrefs.enableViewTransitions ?? true}
          renderItem={(stream) => {
            const uniqueCardId = `${stream.appId}-${stream.cycleName}`;
            const isHovered = hoverState.cardId === uniqueCardId;
            const isImageReady = hoveredImage?.gameId === stream.appId;
            const activeImg = (isHovered && isImageReady && hoveredImage?.url) ? hoveredImage.url : stream.cover;

            return (
              <div
                onClick={(e) => handleCardClick(e, uniqueCardId, stream.appId, stream.cycleName)}
                onMouseEnter={() => onHoverGame(uniqueCardId, stream.appId)}
                onMouseLeave={() => onHoverGame(null, null)}
                className={`group cursor-pointer overflow-hidden ${
                  isHovered 
                    ? 'scale-105 shadow-2xl z-20 border-white/20' 
                    : 'shadow-xl hover:scale-105 hover:shadow-2xl hover:z-10 hover:delay-300 delay-0'
                }`}
                style={cardStyle}
              >
                <div className="relative overflow-hidden aspect-video bg-black/40 shrink-0">
                  <CrossfadeImage 
                    src={activeImg} 
                    alt={stream.gameName} 
                    className="absolute inset-0 w-full h-full" 
                    imgClassName="object-cover" 
                  />
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent transition-opacity duration-300 z-30 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>
                <div className="p-3 flex flex-col flex-1" style={{ padding: `clamp(12px, ${layoutPrefs.cardPadding}px, 20px)` }}>
                  <h3 className={`font-bold leading-tight break-words drop-shadow-md transition-colors duration-300 ${isHovered ? 'text-[#e8c87a]' : 'group-hover:text-[#e8c87a]'}`} style={{ fontSize: `${systemFonts.libTitle}px` }}>
                    {stream.gameName}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 items-center mt-1 mb-auto">
                    <p className="text-white/80 drop-shadow-md" style={{ fontSize: `${systemFonts.libYear}px` }}>
                      {stream.cycleDisplayName} • Session #{stream.count}
                    </p>
                  </div>

                  <p className="text-white/50 mt-3 font-mono drop-shadow-md" style={{ fontSize: `${systemFonts.dashboardTime || 10}px` }}>
                    {stream.lastTimeStr}
                  </p>
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}