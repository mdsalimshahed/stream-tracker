import React from 'react';
import { CrossfadeImage } from '../../common/UIComponents';

export const getCard3Slide = (index, data) => {
  const { latestBgImage, mostRecentGame, timeSinceLastStream } = data;
  switch (index) {
    case 0: return (
      <div className="slide-container justify-end">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
        <div className="latest-bg">
          <CrossfadeImage src={latestBgImage} alt="latest game" className="w-full h-full" imgClassName="object-cover" duration={700} />
        </div>
        <div className="latest-content">
          <div className="stat-number drop-shadow-xl latest-title transition-colors duration-300">
            {mostRecentGame?.game_name || '—'}
          </div>
          <div className="stat-sub latest-sub-3">{mostRecentGame?.latestRunName || ''}</div>
          <div className="stat-sub latest-sub-1">Last streamed: <span className="latest-sub-time">{timeSinceLastStream}</span></div>
          <div className="stat-sub latest-sub-2">{mostRecentGame?.lastStreamTimestampRaw ? `On ${mostRecentGame.lastStreamTimestampRaw}` : 'Unknown'}</div>
        </div>
      </div>
    );
    case 1: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 6</span></div>;
    case 2: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 9</span></div>;
    case 3: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 12</span></div>;
    case 4: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 15</span></div>;
    case 5: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 18</span></div>;
    default: return null;
  }
};