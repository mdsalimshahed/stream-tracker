// src/components/stats/slides/card2/Card2Slide6.jsx
import React from 'react';

export default function Card2Slide6({ data }) {
  const { zeroStreamDays } = data;
  return (
    <div className="slide-container">
      <div className="stat-number top-number">{zeroStreamDays?.toLocaleString() || 0}</div>
      <div className="stat-label">{zeroStreamDays === 1 ? 'Day Without Streams' : 'Days Without Streams'}</div>
    </div>
  );
}