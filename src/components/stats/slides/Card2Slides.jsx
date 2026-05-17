import React from 'react';
import Card2Slide0 from './card2/Card2Slide0';
import Card2Slide1 from './card2/Card2Slide1';
import Card2Slide2 from './card2/Card2Slide2';
import Card2Slide3 from './card2/Card2Slide3'; // Formerly Slide6
import Card2Slide4 from './card2/Card2Slide4'; // Formerly Slide7

export const getCard2Slide = (index, data) => {
  switch (index) {
    case 0: return <Card2Slide0 data={data} />;
    case 1: return <Card2Slide1 data={data} />;
    case 2: return <Card2Slide2 data={data} />;
    case 3: return <Card2Slide3 data={data} />;
    case 4: return <Card2Slide4 data={data} />;
    default: return null;
  }
};