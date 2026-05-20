// src/components/DebugSlides.jsx
import React, { useState, useEffect } from 'react';
import { getLowResUrl } from '../utils/helpers';
import { STYLES } from './stats/styles';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

import { getCard1Slide } from './stats/slides/Card1Slides';
import { getCard2Slide } from './stats/slides/Card2Slides';
import { getCard3Slide } from './stats/slides/Card3Slides';

const SLIDE_TITLES = [
  "Latest Stream Overview",
  "Stream Timeline & Playtime",
  "Cumulative Playtime Progression",
  "Daily Playtime Distribution",
  "Chronological Stream Sequence",
  "Game Tags Word Cloud",
  "Hourly Stream Frequency",
  "Playtime by Game Status",
  "Streams by Day of Week",
  "Stream Deficit/Gain (Time Differences)"
];

export default function DebugSlides({ layoutPrefs, systemFonts, cachedStats }) {
  const { card1Data, card2Data, card3Data, isReady } = cachedStats;

  const [latestBgIndex, setLatestBgIndex] = useState(0);
  const [currentGraphIdx, setCurrentGraphIdx] = useState(0); 
  const [slideDir, setSlideDir] = useState('right'); 
  
  const latestGameImages = card3Data?.mostRecentGame?.thumbnail_urls || [];

  // Background slideshow logic
  useEffect(() => {
    if (latestGameImages.length < 2) return;
    const initialDelay = Math.random() * 2000;
    const cycleInterval = 3500 + Math.random() * 1000;
    let interval;
    const timeout = setTimeout(() => {
      setLatestBgIndex(prev => (prev + 1) % latestGameImages.length);
      interval = setInterval(() => {
        setLatestBgIndex(prev => (prev + 1) % latestGameImages.length);
      }, cycleInterval);
    }, initialDelay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [latestGameImages]);

  // Keyboard Navigation logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Added support for 'A' and 'D' keys
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrev = () => {
    setSlideDir('left');
    setCurrentGraphIdx(p => (p === 0 ? 9 : p - 1));
  };

  const handleNext = () => {
    setSlideDir('right');
    setCurrentGraphIdx(p => (p + 1) % 10);
  };

  const handleDotClick = (i) => {
    if (i === currentGraphIdx) return;
    setSlideDir(i > currentGraphIdx ? 'right' : 'left');
    setCurrentGraphIdx(i);
  };

  if (!isReady || !card1Data) {
    return <div className="flex items-center justify-center h-full text-white/50"><Loader2 className="animate-spin mr-2"/> Compiling data...</div>;
  }

  const heroThumb = latestGameImages[0] || '';
  const rawLatestBgImage = latestGameImages[latestBgIndex] || heroThumb;
  const latestBgImage = getLowResUrl(rawLatestBgImage, layoutPrefs?.highResImages);

  const slideData1 = { ...card1Data, totalStreamsCount: card1Data.totalStreams };
  const slideData2 = { ...card2Data, totalGamesCount: card2Data.totalGames };
  const slideData3 = { ...card3Data, latestBgImage };

  const card12Slides = [
    { card: 1, idx: 0 }, { card: 2, idx: 0 },
    { card: 1, idx: 1 }, { card: 2, idx: 1 },
    { card: 1, idx: 2 }, { card: 2, idx: 2 },
    { card: 1, idx: 3 }, { card: 2, idx: 3 },
    { card: 1, idx: 4 }, { card: 2, idx: 4 },
    { card: 1, idx: 5 }, { card: 2, idx: 5 },
  ];

  const renderCard12Content = ({ card, idx }, animIndex) => {
    const inner = card === 1
      ? <div className="stat-card absolute inset-0">{getCard1Slide(idx, slideData1)}</div>
      : <div className="stat-card absolute inset-0">{getCard2Slide(idx, slideData2)}</div>;

    return (
      <div
        key={`c${card}-${idx}`}
        className="w-full aspect-[16/9] relative shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
        style={{ animationDelay: `${animIndex * 50}ms` }}
      >
        {inner}
      </div>
    );
  };

  const renderCard3Content = (idx) => {
    const slideAnimation = slideDir === 'right' ? 'animate-slide-right' : 'animate-slide-left';

    return (
      <div
        key={`c3-${idx}`}
        className={`w-full h-full ${slideAnimation}`}
      >
        <div className="stats-right-col absolute inset-0 rounded-2xl overflow-visible shadow-2xl border border-white/10">
          {getCard3Slide(idx, slideData3)}
        </div>
      </div>
    );
  };

  const titleAnimation = slideDir === 'right' ? 'animate-slide-right' : 'animate-slide-left';

  return (
    <div
      className="stats-root debug-slides w-full h-full relative flex flex-col overflow-hidden bg-black/40"
      style={{
        '--sz-main': systemFonts?.statsMainCount ?? 4.5,
        '--sz-main-label': systemFonts?.statsMainLabel ?? 1.1,
        '--sz-title': systemFonts?.statsTitle ?? 2.2,
        '--sz-sub': systemFonts?.statsSub ?? 1.1,
        '--sz-label': systemFonts?.statsLabel ?? 1.1,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar p-6 sm:p-10">
        <div className="max-w-[1800px] mx-auto pb-20 flex flex-col gap-16">

          {/* GRAPHS CAROUSEL (Card 3) */}
          <div className="w-full flex flex-col items-center">
            
            <h2 
              key={`title-${currentGraphIdx}`}
              className={`text-xl sm:text-2xl font-bold text-white/90 mt-24 mb-16 uppercase tracking-widest flex items-center gap-3 ${titleAnimation}`}
            >
              <span className="w-8 h-[2px] bg-[#e8c87a]"></span> 
              {SLIDE_TITLES[currentGraphIdx]} 
              <span className="w-8 h-[2px] bg-[#e8c87a]"></span>
            </h2>
            
            <div className="relative w-full max-w-[1200px] h-[420px] group">
              {renderCard3Content(currentGraphIdx)}

              <button
                onClick={handlePrev}
                className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 border border-white/10 backdrop-blur-xl rounded-full text-white transition-all shadow-2xl z-50 hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={28} />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/90 border border-white/10 backdrop-blur-xl rounded-full text-white transition-all shadow-2xl z-50 hover:scale-110 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={28} />
              </button>

              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleDotClick(i)}
                    className={`transition-all duration-300 rounded-full ${i === currentGraphIdx ? 'w-8 h-2.5 bg-[#e8c87a] shadow-[0_0_10px_rgba(232,200,122,0.5)]' : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

          {/* STATS GRID (Cards 1 & 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {card12Slides.map((slide, i) => renderCard12Content(slide, i))}
          </div>

        </div>
      </div>
    </div>
  );
}