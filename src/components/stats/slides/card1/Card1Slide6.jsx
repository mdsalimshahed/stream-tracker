// src/components/stats/slides/card1/Card1Slide6.jsx
import React from 'react';
import { parseSeconds, formatDtShort } from '../SlideHelpers';

export default function Card1Slide6({ data }) {
  const { maxDailySecs, maxDailyDateMs } = data;
  const { d, h, m, s } = parseSeconds(maxDailySecs || 0);

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
      
      <div className="stat-label mt-2 text-white/80 font uppercase tracking-widest">
        Most Time Streamed
        <div className="text-[var(--c-accent2)] normal-case tracking-normal font-medium mt-1 truncate w-full pr-4" style={{ fontSize: 'calc(var(--sz-main-label) * var(--unit-085, 0.85rem))' }}>
          {maxDailyDateMs ? formatDtShort(maxDailyDateMs) : '—'}
        </div>
      </div>
    </div>
  );
}