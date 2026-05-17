// src/components/DebugSlides.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getLowResUrl } from '../utils/helpers';
import { STYLES } from './stats/styles';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

import { getCard1Slide } from './stats/slides/Card1Slides';
import { getCard2Slide } from './stats/slides/Card2Slides';
import { getCard3Slide } from './stats/slides/Card3Slides';

export default function DebugSlides({ layoutPrefs, systemFonts, cachedStats }) {
  const { card1Data, card2Data, card3Data, isReady } = cachedStats;

  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 18;

  const [latestBgIndex, setLatestBgIndex] = useState(0);
  const latestGameImages = card3Data?.mostRecentGame?.thumbnail_urls || [];

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

  const handlePrev = useCallback(() => {
    setActiveSlide(prev => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const handleNext = useCallback(() => {
    setActiveSlide(prev => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  if (!isReady || !card1Data) {
    return <div className="flex items-center justify-center h-full text-white/50"><Loader2 className="animate-spin mr-2"/> Compiling data...</div>;
  }

  const heroThumb = latestGameImages[0] || '';
  const rawLatestBgImage = latestGameImages[latestBgIndex] || heroThumb;
  const latestBgImage = getLowResUrl(rawLatestBgImage, layoutPrefs?.highResImages);

  const slideData1 = { ...card1Data, totalStreamsCount: card1Data.totalStreams };
  const slideData2 = { ...card2Data, totalGamesCount: card2Data.totalGames };
  const slideData3 = { ...card3Data, latestBgImage };

  const renderActiveCardContent = () => {
    if (activeSlide < 6) {
      return (
        <div className="stat-card h-full w-full relative" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {getCard1Slide(activeSlide, slideData1)}
        </div>
      );
    }
    if (activeSlide < 12) {
      const idx = activeSlide - 6;
      return (
        <div className="stat-card h-full w-full relative" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {getCard2Slide(idx, slideData2)}
        </div>
      );
    }
    const idx = activeSlide - 12;
    return (
      <div className="stats-right-col h-full w-full relative" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        {getCard3Slide(idx, slideData3)}
      </div>
    );
  };

  return (
    <div className="stats-root w-full h-full relative flex flex-col overflow-hidden bg-black/40"
      style={{
        '--sz-main': systemFonts?.statsMainCount ?? 4.5,
        '--sz-main-label': systemFonts?.statsMainLabel ?? 1.1,
        '--sz-title': systemFonts?.statsTitle ?? 2.2,
        '--sz-sub': systemFonts?.statsSub ?? 1.1,
        '--sz-label': systemFonts?.statsLabel ?? 1.1,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="flex-1 w-full h-full flex flex-col justify-center items-center relative px-12 sm:px-16">
        
        <button 
          onClick={handlePrev} 
          className="absolute left-2 sm:left-4 md:left-8 z-50 p-2 text-white/30 hover:text-white hover:scale-110 transition-all cursor-pointer"
        >
          <ChevronLeft size={48} strokeWidth={1.5} />
        </button>

        <button 
          onClick={handleNext} 
          className="absolute right-2 sm:right-4 md:right-8 z-50 p-2 text-white/30 hover:text-white hover:scale-110 transition-all cursor-pointer"
        >
          <ChevronRight size={48} strokeWidth={1.5} />
        </button>

        {/* Tighter constraints (max-w-4xl, defined aspect ratios/heights) for clean text scaling */}
        <div 
          key={activeSlide} 
          className="w-full max-w-4xl h-[60vh] min-h-[400px] max-h-[600px] relative shadow-2xl animate-in fade-in duration-300"
        >
          {renderActiveCardContent()}
        </div>

        <div className="absolute bottom-6 md:bottom-10 left-0 right-0 flex justify-center items-center gap-2 z-30">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === i 
                  ? 'w-2.5 h-2.5 bg-white opacity-100 scale-110' 
                  : 'w-2 h-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}