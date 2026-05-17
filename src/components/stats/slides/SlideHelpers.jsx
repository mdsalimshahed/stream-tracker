// src/components/stats/slides/SlideHelpers.jsx
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
  const s = Math.floor(totalSecs % 60);
  
  let result = [];
  if (h > 0) result.push(`${h} hour${h !== 1 ? 's' : ''}`);
  if (m > 0 || h > 0) result.push(`${m} minute${m !== 1 ? 's' : ''}`);
  result.push(`${s} second${s !== 1 ? 's' : ''}`);
  
  return result.join(' ');
};

export const parseSeconds = (totalSecs) => {
  const S = totalSecs || 0;
  return {
    d: Math.floor(S / 86400),
    h: Math.floor((S % 86400) / 3600),
    m: Math.floor((S % 3600) / 60),
    s: Math.floor(S % 60)
  };
};

export const formatDtShort = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  const day = getOrdinal(d.getDate());
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
};