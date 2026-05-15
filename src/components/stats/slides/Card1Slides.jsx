import React from 'react';
import { renderPlaceholder } from './SlideHelpers';
import Card1Slide0 from './card1/Card1Slide0';
import Card1Slide1 from './card1/Card1Slide1';
import Card1Slide2 from './card1/Card1Slide2';

export const getCard1Slide = (index, data) => {
  switch (index) {
    case 0: return <Card1Slide0 data={data} />;
    case 1: return <Card1Slide1 data={data} />;
    case 2: return <Card1Slide2 data={data} />;
    case 3: return renderPlaceholder(10);
    case 4: return renderPlaceholder(13);
    case 5: return renderPlaceholder(16);
    default: return null;
  }
};