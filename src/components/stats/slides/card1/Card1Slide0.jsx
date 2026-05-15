import React from 'react';

export default function Card1Slide0({ data }) {
  const { totalStreamsCount, totalStreams } = data;
  return (
    <div className="slide-container">
      <div className="stat-number top-number">{totalStreamsCount.toLocaleString()}</div>
      <div className="stat-label">{totalStreams === 1 ? 'Stream' : 'Streams'}</div>
    </div>
  );
}