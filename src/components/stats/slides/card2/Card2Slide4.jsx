// src/components/stats/slides/card2/Card2Slide4.jsx
import React from 'react';
import { formatDtShort, formatFullTime } from '../SlideHelpers';

export default function Card2Slide4({ data }) {
  const { busiestDayObj } = data;
  
  if (!busiestDayObj || !busiestDayObj.dateMs) {
    return <div className="slide-container justify-center"><div className="text-white/50 text-center text-xs uppercase tracking-widest">No Stream Data</div></div>;
  }

  const fullDate = formatDtShort(busiestDayObj.dateMs);
  const timePlayedString = formatFullTime(busiestDayObj.secs);
  
  return (
    <div className="slide-container relative z-10 w-full h-full flex flex-col justify-center">
      <div className="stat-number drop-shadow-2xl leading-tight text-white" style={{ fontSize: 'calc(var(--sz-main) * var(--unit-07, 0.7rem))' }}>
        {fullDate}
      </div>
      <div className="stat-label mt-2 text-white/80 font uppercase tracking-widest">
        Busiest Day
        <div className="text-[var(--c-accent2)] normal-case tracking-normal font-medium mt-1 truncate w-full pr-4" style={{ fontSize: 'calc(var(--sz-main-label) * var(--unit-085, 0.85rem))' }}>
          {busiestDayObj.count} stream{busiestDayObj.count !== 1 ? 's' : ''} and {timePlayedString} played
        </div>
      </div>
    </div>
  );
}