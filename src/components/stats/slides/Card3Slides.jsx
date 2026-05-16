// src/components/stats/slides/Card3Slides.jsx
import React from 'react';
import Card3Slide0 from './card3/Card3Slide0';
import Card3Slide1 from './card3/Card3Slide1';
import Card3Slide2 from './card3/Card3Slide2';
import Card3Slide3 from './card3/Card3Slide3';
import Card3Slide4 from './card3/Card3Slide4';
import Card3Slide5 from './card3/Card3Slide5';

export const getCard3Slide = (index, data) => {
  switch (index) {
    case 0: return <Card3Slide0 data={data} />;
    case 1: return <Card3Slide1 data={data} />;
    case 2: return <Card3Slide2 data={data} />;
    case 3: return <Card3Slide3 data={data} />;
    case 4: return <Card3Slide4 data={data} />;
    case 5: return <Card3Slide5 data={data} />;
    default: return <div className="slide-container flex items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Placeholder</span></div>;
  }
};