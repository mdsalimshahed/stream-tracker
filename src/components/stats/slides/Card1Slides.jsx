// src/components/stats/slides/Card1Slides.jsx
import React from 'react';
import { renderPlaceholder } from './SlideHelpers';

export const getCard1Slide = (index, data) => {
  const { totalStreamsCount, totalStreams, totalDuration } = data;
  
  switch (index) {
    case 0: return (
      <div className="slide-container">
        <div className="stat-number top-number">{totalStreamsCount.toLocaleString()}</div>
        <div className="stat-label">{totalStreams === 1 ? 'Stream' : 'Streams'}</div>
      </div>
    );
    
    // SLIDE 4: Total Hours Played
    case 1: {
      const h = Math.floor((totalDuration || 0) / 3600);
      const m = Math.floor(((totalDuration || 0) % 3600) / 60);
      const s = (totalDuration || 0) % 60;
      
      return (
        <div className="slide-container">
          <div className="stat-number flex items-baseline flex-wrap leading-none gap-x-5 gap-y-2">
            
            {/* Hours (Large) */}
            <div className="flex items-baseline gap-2">
              <span className="text-white" style={{ fontSize: 'calc(var(--sz-main) * 1rem)' }}>
                {h.toLocaleString()}
              </span>
              <span className="text-white/50" style={{ fontSize: 'calc(var(--sz-main) * 0.35rem)' }}>
                {h === 1 ? 'hour' : 'hours'}
              </span>
            </div>
            
            {/* Minutes & Seconds (Medium) */}
            <div className="flex items-baseline gap-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-white" style={{ fontSize: 'calc(var(--sz-main) * 0.55rem)' }}>
                  {m}
                </span>
                <span className="text-white/50" style={{ fontSize: 'calc(var(--sz-main) * 0.25rem)' }}>
                  {m === 1 ? 'minute' : 'minutes'}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1.5">
                <span className="text-white" style={{ fontSize: 'calc(var(--sz-main) * 0.55rem)' }}>
                  {s}
                </span>
                <span className="text-white/50" style={{ fontSize: 'calc(var(--sz-main) * 0.25rem)' }}>
                  {s === 1 ? 'second' : 'seconds'}
                </span>
              </div>
            </div>
            
          </div>
          
          <div className="stat-label mt-2">Total Playtime</div>
        </div>
      );
    }
    
    case 2: return renderPlaceholder(7);
    case 3: return renderPlaceholder(10);
    case 4: return renderPlaceholder(13);
    case 5: return renderPlaceholder(16);
    default: return null;
  }
};