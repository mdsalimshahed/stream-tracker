// src/components/stats/slides/card2/Card2Slide4.jsx
import React, { useState, useEffect } from 'react';
import { CrossfadeImage } from '../../../common/UIComponents';
import { getLowResUrl } from '../../../../utils/helpers';
import { parseSeconds } from '../SlideHelpers';

export default function Card2Slide4({ data }) {
  const { shortestStream, highResImages } = data;
  const [bgIndex, setBgIndex] = useState(0);

  const images = shortestStream?.thumbnails || [];

  useEffect(() => {
    if (images.length < 2) return;
    const interval = setInterval(() => setBgIndex(prev => (prev + 1) % images.length), 3500);
    return () => clearInterval(interval);
  }, [images]);

  if (!shortestStream) return <div className="slide-container justify-center"><div className="text-white/50 text-center">No stream data</div></div>;

  const bgImage = getLowResUrl(images[bgIndex] || '', highResImages);
  const { d, h, m, s } = parseSeconds(shortestStream.duration);

  const renderBig = (val, unit) => (
    <div className="flex items-baseline gap-2">
      <span className="text-white drop-shadow-2xl" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-1, 1rem))' }}>{val.toLocaleString()}</span>
      <span className="text-white/90 font-normal lowercase" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-035, 0.35rem))' }}>{val === 1 ? unit.slice(0, -1) : unit}</span>
    </div>
  );

  const renderSmall = (val, unit) => (
    <div className="flex items-baseline gap-1.5">
      <span className="text-white drop-shadow-xl" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-055, 0.55rem))' }}>{val}</span>
      <span className="text-white/90 font-normal lowercase" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-025, 0.25rem))' }}>{val === 1 ? unit.slice(0, -1) : unit}</span>
    </div>
  );

  return (
    <>
      <div className="absolute inset-0 z-0 bg-black pointer-events-none overflow-hidden" style={{ borderRadius: 'inherit' }}>
        <div className="w-full h-full opacity-35">
          <CrossfadeImage 
            src={bgImage} 
            className="w-full h-full" 
            imgClassName="w-full h-full object-cover transition-opacity duration-500" 
            duration={700} 
          />
        </div>
      </div>

      <div className="slide-container relative z-10 w-full h-full flex flex-col justify-center">
        <div className="stat-number flex items-baseline flex-wrap leading-none gap-x-5 gap-y-2">
          {d > 0 && renderBig(d, 'days')}
          {d === 0 && h > 0 && renderBig(h, 'hours')}
          {d === 0 && h === 0 && m > 0 && renderBig(m, 'minutes')}
          {d === 0 && h === 0 && m === 0 && renderBig(s, 'seconds')}
          <div className="flex items-baseline gap-4">
            {d > 0 && renderSmall(h, 'hours')}
            {(d > 0 || h > 0) && renderSmall(m, 'minutes')}
            {(d > 0 || h > 0 || m > 0) && renderSmall(s, 'seconds')}
          </div>
        </div>
        <div className="stat-label mt-2 text-white/80 font-bold uppercase tracking-widest">
          Shortest Stream
          <div className="text-[var(--c-accent2)] normal-case tracking-normal font-bold mt-1 truncate w-full pr-4" style={{ fontSize: 'calc(var(--sz-main-label) * var(--unit-085, 0.85rem))' }}>
            {shortestStream.streamTitle}
          </div>
        </div>
      </div>
    </>
  );
}