import React from 'react';

export const renderPlaceholder = (num) => (
  <div className="slide-container items-center justify-center">
    <span className="font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md text-2xl lg:text-3xl">
      Slide {num}
    </span>
  </div>
);