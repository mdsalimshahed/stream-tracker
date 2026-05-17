// src/components/DebugSlides.jsx
import React, { useState, useEffect } from 'react';
import { getLowResUrl } from '../utils/helpers';
import { STYLES } from './stats/styles';
import { Loader2 } from 'lucide-react';

import { getCard1Slide } from './stats/slides/Card1Slides';
import { getCard2Slide } from './stats/slides/Card2Slides';
import { getCard3Slide } from './stats/slides/Card3Slides';

export default function DebugSlides({ layoutPrefs, systemFonts, cachedStats }) {
  const { card1Data, card2Data, card3Data, isReady } = cachedStats;

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

  if (!isReady || !card1Data) {
    return <div className="flex items-center justify-center h-full text-white/50"><Loader2 className="animate-spin mr-2"/> Compiling data...</div>;
  }

  const heroThumb = latestGameImages[0] || '';
  const rawLatestBgImage = latestGameImages[latestBgIndex] || heroThumb;
  const latestBgImage = getLowResUrl(rawLatestBgImage, layoutPrefs?.highResImages);

  const slideData1 = { ...card1Data, totalStreamsCount: card1Data.totalStreams };
  const slideData2 = { ...card2Data, totalGamesCount: card2Data.totalGames };
  const slideData3 = { ...card3Data, latestBgImage };

  // Separate Card 1/2 slides from Card 3 slides
  const card12Slides = [
    // TEXT SLIDES
    { card: 1, idx: 0 }, // Total Streams
    { card: 1, idx: 1 }, // Total Playtime
    { card: 1, idx: 2 }, // Longest Streak
    { card: 1, idx: 3 }, // Longest Stream
    { card: 1, idx: 4 }, // Total Session Duration
    { card: 1, idx: 6 }, // Most time streamed in one day
    { card: 1, idx: 7 }, // Quiet Hours
    { card: 2, idx: 0 }, // Games in Library
    { card: 2, idx: 1 }, // Longest Break
    { card: 2, idx: 2 }, // Shortest Stream
    { card: 2, idx: 6 }, // Days without streams
    { card: 2, idx: 7 }, // Peak Stream Time
  ];

  const card3Slides = [
    { card: 3, idx: 0 }, // Latest Game info
    { card: 3, idx: 1 }, // Games Timeline
    { card: 3, idx: 2 }, // Progression Lines
    { card: 3, idx: 3 }, // Daily Playtime
    { card: 3, idx: 4 }, // Chronological Streams
    { card: 3, idx: 5 }, // Tag Frequencies
    { card: 3, idx: 6 }, // Hourly Stream Count
    { card: 3, idx: 7 }, // Playtime by Status
    { card: 3, idx: 8 }, // Day of Week
    { card: 3, idx: 9 }, // Deficit Data
  ];

  const renderCard12Content = ({ card, idx }, animIndex) => {
    const inner = card === 1
      ? <div className="stat-card absolute inset-0" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>{getCard1Slide(idx, slideData1)}</div>
      : <div className="stat-card absolute inset-0" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>{getCard2Slide(idx, slideData2)}</div>;

    return (
      <div
        key={`c${card}-${idx}`}
        className="w-full aspect-[16/9] relative shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
        style={{ animationDelay: `${animIndex * 100}ms` }}
      >
        {inner}
      </div>
    );
  };

  const renderCard3Content = ({ idx }, animIndex) => (
    <div
      key={`c3-${idx}`}
      className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
      style={{
        // Cap width so it doesn't stretch edge-to-edge; keep 16/9 aspect ratio
        maxWidth: '1200px',
        height: '420px',
        position: 'relative',
        animationDelay: `${(card12Slides.length + animIndex) * 100}ms`,
      }}
    >
      <div
        className="stats-right-col absolute inset-0"
        style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {getCard3Slide(idx, slideData3)}
      </div>
    </div>
  );

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
        <div className="max-w-[1800px] mx-auto pb-20 flex flex-col gap-12">

          {/* ── Card 1 & 2: original 3-column grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {card12Slides.map((slide, i) => renderCard12Content(slide, i))}
          </div>

          {/* ── Card 3: centered vertical stack ── */}
          <div className="flex flex-col items-center gap-6 sm:gap-8 w-full">
            {card3Slides.map((slide, i) => renderCard3Content(slide, i))}
          </div>

        </div>
      </div>
    </div>
  );
}