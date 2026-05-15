import React from 'react';

export default function Card2Slide0({ data }) {
  const { totalGamesCount, totalGames } = data;
  return (
    <div className="slide-container">
      <div className="stat-number top-number">{totalGamesCount}</div>
      <div className="stat-label">{totalGames === 1 ? 'Game in Library' : 'Games in Library'}</div>
    </div>
  );
}