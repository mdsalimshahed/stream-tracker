import React, { useState, useEffect } from 'react';
import { CrossfadeImage } from '../../../common/UIComponents';
import { getLowResUrl } from '../../../../utils/helpers';

export default function Card1Slide4({ data }) {
  const { longestStream, highResImages } = data;
  const [bgIndex, setBgIndex] = useState(0);

  const images = longestStream?.thumbnails || [];

  useEffect(() => {
    if (images.length < 2) return;
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [images]);

  if (!longestStream) {
    return <div className="slide-container justify-center"><div className="text-white/50 text-center">No stream data</div></div>;
  }

  const bgImage = getLowResUrl(images[bgIndex] || '', highResImages);

  const S = longestStream.duration || 0;
  const d = Math.floor(S / 86400);
  const h = Math.floor((S % 86400) / 3600);
  const m = Math.floor((S % 3600) / 60);
  const s = Math.floor(S % 60);

  const renderBig = (val, unit) => (
    <div className="flex items-baseline gap-2">
      <span className="text-white drop-shadow-lg" style={{ fontSize: 'calc(var(--sz-main) * 1rem)' }}>
        {val.toLocaleString()}
      </span>
      <span className="text-white/80 font-normal lowercase drop-shadow-md" style={{ fontSize: 'calc(var(--sz-main) * 0.35rem)' }}>
        {val === 1 ? unit.slice(0, -1) : unit}
      </span>
    </div>
  );

  const renderSmall = (val, unit) => (
    <div className="flex items-baseline gap-1.5">
      <span className="text-white drop-shadow-md" style={{ fontSize: 'calc(var(--sz-main) * 0.55rem)' }}>
        {val}
      </span>
      <span className="text-white/80 font-normal lowercase drop-shadow-md" style={{ fontSize: 'calc(var(--sz-main) * 0.25rem)' }}>
        {val === 1 ? unit.slice(0, -1) : unit}
      </span>
    </div>
  );

  return (
    <>
      {/* Moved opacity-10 to the wrapper div so it caps the entire component's visibility */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-45" 
        style={{ borderRadius: 'inherit' }}
      >
        <CrossfadeImage 
          src={bgImage} 
          className="w-full h-full" 
          imgClassName="w-full h-full object-cover transition-opacity duration-500" 
          duration={700} 
        />
      </div>
      
      {/* Foreground Content */}
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
        
        <div className="stat-label mt-2 drop-shadow-lg text-white/70">
          Longest Stream
          <div 
            className="text-[var(--c-accent2)] normal-case tracking-normal font-medium mt-1 truncate w-full pr-4 drop-shadow-md" 
            style={{ fontSize: 'calc(var(--sz-main-label) * 0.85rem)' }}
          >
            {longestStream.streamTitle}
          </div>
        </div>
      </div>
    </>
  );
}