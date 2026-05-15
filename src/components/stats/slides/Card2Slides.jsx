import React from 'react';
import { renderPlaceholder } from './SlideHelpers';
import Card2Slide0 from './card2/Card2Slide0';
import Card2Slide1 from './card2/Card2Slide1';

export const getCard2Slide = (index, data) => {
  switch (index) {
    case 0: return <Card2Slide0 data={data} />;
    case 1: return <Card2Slide1 data={data} />;
    default: return renderPlaceholder(index * 3 + 2);
  }
};