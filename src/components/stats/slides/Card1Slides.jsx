import React from 'react';
import { renderPlaceholder } from './SlideHelpers';

export const getCard1Slide = (index, data) => {
  const { totalStreamsCount, totalStreams } = data;
  switch (index) {
    case 0: return (
      <div className="slide-container">
        <div className="stat-number top-number">{totalStreamsCount.toLocaleString()}</div>
        <div className="stat-label">{totalStreams === 1 ? 'Stream' : 'Streams'}</div>
      </div>
    );
    case 1: return renderPlaceholder(4);
    case 2: return renderPlaceholder(7);
    case 3: return renderPlaceholder(10);
    case 4: return renderPlaceholder(13);
    case 5: return renderPlaceholder(16);
    default: return null;
  }
};