// src/components/stats/slides/card1/Card1Slide5.jsx
import React, { useState, useEffect } from 'react';
import { CrossfadeImage } from '../../../common/UIComponents';
import { getLowResUrl } from '../../../../utils/helpers';
import { parseSeconds } from '../SlideHelpers';

export default function Card1Slide5({ data }) {
  const { closestReleaseGame, dayZeroGames, highResImages } = data;
  const [bgIndex, setBgIndex] = useState(0);

  const images = closestReleaseGame?.thumbnails || [];

  useEffect(() => {
    if (images.length < 2) return;
    const interval = setInterval(() => setBgIndex(prev => (prev + 1) % images.length), 3500);
    return () => clearInterval(interval);
  }, [images]);

  if (!closestReleaseGame) return <div className="slide-container justify-center"><div className="text-white/50 text-center text-xs uppercase tracking-widest">Awaiting Release Date Data</div></div>;

  const bgImage = getLowResUrl(images[bgIndex] || '', highResImages);
  
  let diffText = "";
  let extraGamesText = null;

  if (closestReleaseGame.diffMs < 86400000) {
    diffText = "Streamed on day zero";
    // Check if there are other games streamed on day zero
    const otherGames = (dayZeroGames || []).filter(name => name !== closestReleaseGame.gameName);
    if (otherGames.length > 0) {
      extraGamesText = `Also streamed on day zero: ${otherGames.join(', ')}`;
    }
  } else {
    const { d, h } = parseSeconds(closestReleaseGame.diffMs / 1000);
    if (d > 0) diffText = `${d.toLocaleString()} day${d !== 1 ? 's' : ''} after release`;
    else diffText = `${h.toLocaleString()} hour${h !== 1 ? 's' : ''} after release`;
  }

  return (
    <>
      <div className="absolute inset-0 z-0 bg-black pointer-events-none overflow-hidden" style={{ borderRadius: 'inherit' }}>
        <div className="w-full h-full opacity-35">
          <CrossfadeImage src={bgImage} className="w-full h-full" imgClassName="w-full h-full object-cover transition-opacity duration-500" duration={700} />
        </div>
      </div>

      <div className="slide-container relative z-10 w-full h-full flex flex-col justify-center">
        <div className="stat-number drop-shadow-2xl leading-tight text-white truncate pr-4" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-07, 0.7rem))' }}>
          {closestReleaseGame.gameName}
        </div>
        <div className="stat-label mt-2 text-white/80 font uppercase tracking-widest">
          Closest to Release
          <div className="text-[var(--c-accent2)] normal-case tracking-normal mt-1 truncate w-full pr-4" style={{ fontSize: 'calc(var(--sz-main-label) * var(--unit-085, 0.85rem))' }}>
            {diffText}
          </div>
          {extraGamesText && (
            <div className="text-white/50 normal-case tracking-normal font-medium mt-1 truncate w-full pr-4 drop-shadow-md" style={{ fontSize: 'calc(var(--sz-sub) * var(--unit-07, 0.7rem))' }}>
              {extraGamesText}
            </div>
          )}
        </div>
      </div>
    </>
  );
}