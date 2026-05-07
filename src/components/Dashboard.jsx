import React, { useState, useEffect } from 'react';
import { parseCustomTimestamp } from '../utils/helpers';

export default function Dashboard({ streamData, openGameProfile, systemFonts, layoutPrefs }) {
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
            cycleDisplayName: cycleData.displayName || (cycleName === 'main' ? 'First Playthrough' : cycleName.replace(/_/g, ' '))
          });
        }
      });
    });
    recent.sort((a, b) => b.lastTimeDate - a.lastTimeDate);
    setRecentStreams(recent.slice(0, 15));
  }, [streamData]);

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
    <div className="overflow-y-auto h-full custom-scrollbar" style={containerStyle}>
      <h2 className="text-2xl font-bold tracking-tight mb-8">Recent Streams</h2>
      {recentStreams.length === 0 && (
        <div className="bg-white/5 rounded-xl p-12 text-center text-white/40">No streams recorded yet. Add a game and start a session.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gap: `${layoutPrefs.cardGap}px` }}>
        {recentStreams.map((stream, idx) => (
          <div
            key={idx}
            onClick={() => openGameProfile(stream.appId, stream.cycleName)}
            className="group cursor-pointer transition-transform duration-200 hover:scale-105 overflow-hidden"
            style={cardStyle}
          >
            <div className="relative overflow-hidden">
              <div className="aspect-video bg-black/40">
                <img src={stream.cover} alt={stream.gameName} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <div className="absolute bottom-2 right-2 bg-blue-600/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-white pointer-events-none">
                Resume
              </div>
            </div>
            <div className="p-3" style={{ padding: `${layoutPrefs.cardPadding}px` }}>
              <h3 className="font-bold text-white leading-tight break-words" style={{ fontSize: `${systemFonts.libTitle}px` }}>
                {stream.gameName}
              </h3>
              <p className="text-white/60 text-sm mt-1" style={{ fontSize: `${systemFonts.libYear}px` }}>
                {stream.cycleDisplayName} • Session #{stream.count}
              </p>
              <p className="text-white/40 text-xs mt-1 font-mono">{stream.lastTimeStr}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}