// src/components/stats/slides/card3/Card3Slide0.jsx
import React from 'react';
import { CrossfadeImage } from '../../../common/UIComponents';
import { useDynamicTime } from '../../hooks';

export default function Card3Slide0({ data }) {
  const { latestBgImage, mostRecentGame } = data;
  const timeSinceLastStream = useDynamicTime(mostRecentGame?.lastStreamTimestampMs);
  
  return (
    <div className="slide-container justify-end outline-none">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
      <div className="latest-bg">
        <CrossfadeImage src={latestBgImage} className="w-full h-full" imgClassName="object-cover" duration={700} />
      </div>
      <div className="latest-content">
        <div className="stat-number drop-shadow-xl latest-title">{mostRecentGame?.game_name || '—'}</div>
        <div className="stat-sub latest-sub-3">{mostRecentGame?.latestRunName || ''}</div>
        <div className="stat-sub latest-sub-1">Last steamed: <span className="latest-sub-time">{timeSinceLastStream}</span></div>
        <div className="stat-sub latest-sub-2">{mostRecentGame?.lastStreamTimestampRaw ? `On ${mostRecentGame.lastStreamTimestampRaw}` : 'Unknown'}</div>
      </div>
    </div>
  );
}