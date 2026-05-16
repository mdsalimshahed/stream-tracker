// src/components/stats/slides/Card1Slides.jsx
import React from 'react';
import { renderPlaceholder } from './SlideHelpers';
import Card1Slide0 from './card1/Card1Slide0';
import Card1Slide1 from './card1/Card1Slide1';
import Card1Slide2 from './card1/Card1Slide2';
import Card1Slide3 from './card1/Card1Slide3';
import Card1Slide4 from './card1/Card1Slide4';
import Card1Slide5 from './card1/Card1Slide5';

export const getCard1Slide = (index, data) => {
  switch (index) {
    case 0: return <Card1Slide0 data={data} />;
    case 1: return <Card1Slide1 data={data} />;
    case 2: return <Card1Slide2 data={data} />;
    case 3: return <Card1Slide3 data={data} />;
    case 4: return <Card1Slide4 data={data} />;
    case 5: return <Card1Slide5 data={data} />;
    default: return null;
  }
};