// src/components/stats/slides/Card2Slides.jsx
import React from 'react';
import Card2Slide0 from './card2/Card2Slide0';
import Card2Slide1 from './card2/Card2Slide1';
import Card2Slide2 from './card2/Card2Slide2';
import Card2Slide3 from './card2/Card2Slide3';
import Card2Slide4 from './card2/Card2Slide4';
import Card2Slide5 from './card2/Card2Slide5';
import Card2Slide6 from './card2/Card2Slide6';
import Card2Slide7 from './card2/Card2Slide7';

export const getCard2Slide = (index, data) => {
  switch (index) {
    case 0: return <Card2Slide0 data={data} />;
    case 1: return <Card2Slide1 data={data} />;
    case 2: return <Card2Slide2 data={data} />;
    case 3: return <Card2Slide3 data={data} />;
    case 4: return <Card2Slide4 data={data} />;
    case 5: return <Card2Slide5 data={data} />;
    case 6: return <Card2Slide6 data={data} />;
    case 7: return <Card2Slide7 data={data} />;
    default: return null;
  }
};