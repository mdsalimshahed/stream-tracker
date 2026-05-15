import React from 'react';

export const renderPlaceholder = (num) => (
  <div className="slide-container items-center justify-center">
    <span className="font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md text-2xl lg:text-3xl">
      Slide {num}
    </span>
  </div>
);

export const formatFullTime = (totalSecs) => {
  if (totalSecs == null) return "0 hours 0 minutes 0 seconds";
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  
  let result = [];
  if (h > 0) result.push(`${h} hour${h !== 1 ? 's' : ''}`);
  if (m > 0 || h > 0) result.push(`${m} minute${m !== 1 ? 's' : ''}`);
  result.push(`${s} second${s !== 1 ? 's' : ''}`);
  
  return result.join(' ');
};