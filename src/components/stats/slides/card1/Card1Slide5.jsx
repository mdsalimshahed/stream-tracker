// src/components/stats/slides/card1/Card1Slide5.jsx
import React from 'react';
import { formatFullTime, parseSeconds } from '../SlideHelpers';

export default function Card1Slide5({ data }) {
  const { actualSessionSecs, discardedSecs, gainedSecs } = data;
  const { d, h, m, s } = parseSeconds(actualSessionSecs);

  const renderBig = (val, unit) => (
    <div className="flex items-baseline gap-2">
      <span className="text-white drop-shadow-lg" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-1, 1rem))' }}>{val.toLocaleString()}</span>
      <span className="text-white/80 font-normal lowercase drop-shadow-md" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-035, 0.35rem))' }}>{val === 1 ? unit.slice(0, -1) : unit}</span>
    </div>
  );

  const renderSmall = (val, unit) => (
    <div className="flex items-baseline gap-1.5">
      <span className="text-white drop-shadow-md" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-055, 0.55rem))' }}>{val}</span>
      <span className="text-white/80 font-normal lowercase drop-shadow-md" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-025, 0.25rem))' }}>{val === 1 ? unit.slice(0, -1) : unit}</span>
    </div>
  );

  return (
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
        Total Session Duration
        <div className="normal-case tracking-normal font-medium mt-1 w-full pr-4 drop-shadow-md space-y-1" style={{ fontSize: 'calc(var(--sz-main-label) * var(--unit-085, 0.85rem))' }}>
          <div className="text-[#ff5c5c]">{formatFullTime(discardedSecs)} discarded</div>
          <div className="text-[#3ddc84]">{formatFullTime(gainedSecs)} gained</div>
        </div>
      </div>
    </div>
  );
}