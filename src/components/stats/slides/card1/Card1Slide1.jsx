import React from 'react';

export default function Card1Slide1({ data }) {
  const { totalDuration } = data;
  
  // Directly calculate absolute total hours, minutes, and seconds so hours > 24 don't roll over to days
  const h = Math.floor((totalDuration || 0) / 3600);
  const m = Math.floor(((totalDuration || 0) % 3600) / 60);
  const s = Math.floor((totalDuration || 0) % 60);

  return (
    <div className="slide-container">
      <div className="stat-number flex items-baseline flex-wrap leading-none gap-x-5 gap-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-white" style={{ fontSize: 'calc(var(--sz-main) * 1rem)' }}>{h.toLocaleString()}</span>
          <span className="text-white/50" style={{ fontSize: 'calc(var(--sz-main) * 0.35rem)' }}>{h === 1 ? 'hour' : 'hours'}</span>
        </div>
        <div className="flex items-baseline gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-white" style={{ fontSize: 'calc(var(--sz-main) * 0.55rem)' }}>{m}</span>
            <span className="text-white/50" style={{ fontSize: 'calc(var(--sz-main) * 0.25rem)' }}>{m === 1 ? 'minute' : 'minutes'}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white" style={{ fontSize: 'calc(var(--sz-main) * 0.55rem)' }}>{s}</span>
            <span className="text-white/50" style={{ fontSize: 'calc(var(--sz-main) * 0.25rem)' }}>{s === 1 ? 'second' : 'seconds'}</span>
          </div>
        </div>
      </div>
      <div className="stat-label mt-2">Total Playtime</div>
    </div>
  );
}