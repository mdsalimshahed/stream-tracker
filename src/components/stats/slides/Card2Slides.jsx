import React from 'react';
import { renderPlaceholder } from './SlideHelpers';

export const getCard2Slide = (index, data) => {
  const { totalGamesCount, totalGames } = data;
  switch (index) {
    case 0: return (
      <div className="slide-container">
        <div className="stat-number top-number">{totalGamesCount}</div>
        <div className="stat-label">{totalGames === 1 ? 'Game in Library' : 'Games in Library'}</div>
      </div>
    );
    case 1: return renderPlaceholder(5);
    case 2: return renderPlaceholder(8);
    case 3: return renderPlaceholder(11);
    case 4: return renderPlaceholder(14);
    case 5: return renderPlaceholder(17);
    default: return null;
  }
};