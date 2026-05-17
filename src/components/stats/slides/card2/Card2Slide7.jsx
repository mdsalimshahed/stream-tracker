// src/components/stats/slides/card2/Card2Slide7.jsx
import React from 'react';

export default function Card2Slide7({ data }) {
  const { peakHourStr, peakHourCount } = data;
  
  return (
    <div className="slide-container relative z-10 w-full h-full flex flex-col justify-center">
      <div className="stat-number drop-shadow-2xl leading-tight text-white" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-08, 0.8rem))' }}>
        {peakHourStr || '—'}
      </div>
      
      <div className="stat-label mt-2 text-white/80 font-bold uppercase tracking-widest">
        Peak Stream Time
        {peakHourCount > 0 && (
          <div className="text-[var(--c-accent2)] normal-case tracking-normal font-medium mt-1 truncate w-full pr-4" style={{ fontSize: 'calc(var(--sz-main-label) * var(--unit-085, 0.85rem))' }}>
            {peakHourCount} stream{peakHourCount !== 1 ? 's' : ''} started during this time
          </div>
        )}
      </div>
    </div>
  );
}