// src/components/stats/slides/card2/Card2Slide3.jsx
import React, { useState, useEffect } from 'react';
import { parseSeconds, formatDtShort } from '../SlideHelpers';

export default function Card2Slide3({ data }) {
  const { longestBreakSecs, maxBreakStartMs, maxBreakEndMs, isActiveBreak } = data;
  const [liveSecs, setLiveSecs] = useState(longestBreakSecs || 0);

  useEffect(() => {
    setLiveSecs(longestBreakSecs || 0);
    if (isActiveBreak && longestBreakSecs) {
      const startNow = Date.now();
      const initialSecs = longestBreakSecs;
      const interval = setInterval(() => setLiveSecs(initialSecs + (Date.now() - startNow) / 1000), 1000);
      return () => clearInterval(interval);
    }
  }, [longestBreakSecs, isActiveBreak]);

  const { d, h, m, s } = parseSeconds(liveSecs);

  const renderBig = (val, unit) => (
    <div className="flex items-baseline gap-2">
      <span className="text-white" style={{ fontSize: 'calc(var(--sz-main) * 1rem)' }}>{val.toLocaleString()}</span>
      <span className="text-white/50 font-normal lowercase" style={{ fontSize: 'calc(var(--sz-main) * 0.35rem)' }}>{val === 1 ? unit.slice(0, -1) : unit}</span>
    </div>
  );

  const renderSmall = (val, unit) => (
    <div className="flex items-baseline gap-1.5">
      <span className="text-white" style={{ fontSize: 'calc(var(--sz-main) * 0.55rem)' }}>{val}</span>
      <span className="text-white/50 font-normal lowercase" style={{ fontSize: 'calc(var(--sz-main) * 0.25rem)' }}>{val === 1 ? unit.slice(0, -1) : unit}</span>
    </div>
  );

  return (
    <div className="slide-container">
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
      <div className="stat-label mt-2">
        Longest Break
        <div className="text-[var(--c-accent2)] normal-case tracking-normal font-medium mt-1 truncate w-full pr-4" style={{ fontSize: 'calc(var(--sz-main-label) * 0.85rem)' }}>
          {liveSecs > 0 ? `${formatDtShort(maxBreakStartMs)} — ${isActiveBreak ? 'Now' : formatDtShort(maxBreakEndMs)}` : '—'}
        </div>
      </div>
    </div>
  );
}