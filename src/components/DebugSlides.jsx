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
    return <div className="flex items-center justify-center h-full text-white/50"><Loader2 className="animate-spin mr-2"/> Compiling data blocks...</div>;
  }

  const heroThumb = latestGameImages[0] || '';
  const rawLatestBgImage = latestGameImages[latestBgIndex] || heroThumb;
  const latestBgImage = getLowResUrl(rawLatestBgImage, layoutPrefs?.highResImages);

  const slideData1 = { ...card1Data, totalStreamsCount: card1Data.totalStreams };
  const slideData2 = { ...card2Data, totalGamesCount: card2Data.totalGames };
  const slideData3 = { ...card3Data, latestBgImage };

  return (
    <div className="stats-root w-full h-full relative"
      style={{
        position: 'relative', 
        height: '100%', 
        width: '100%',
        '--sz-main': systemFonts?.statsMainCount ?? 4.5,
        '--sz-main-label': systemFonts?.statsMainLabel ?? 1.1,
        '--sz-title': systemFonts?.statsTitle ?? 2.2,
        '--sz-sub': systemFonts?.statsSub ?? 1.1,
        '--sz-label': systemFonts?.statsLabel ?? 1.1,
        '--flex-top': (layoutPrefs?.statsRowSplitRatio ?? 0.6) * 100,
        '--flex-bottom': (1 - (layoutPrefs?.statsRowSplitRatio ?? 0.6)) * 100,
        '--flex-left': (layoutPrefs?.statsSplitRatio ?? 0.35) * 100,
        '--flex-right': (1 - (layoutPrefs?.statsSplitRatio ?? 0.35)) * 100,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      {/* CRITICAL FIX: Forced absolute scroll tracking parameters via an inline style layout rule override.
        This forces the browser viewport container to scroll natively regardless of parental height limitations.
      */}
      <div 
        className="custom-scrollbar w-full" 
        style={{ 
          position: 'absolute',
          inset: 0,
          overflowY: 'auto', 
          overflowX: 'hidden',
          display: 'block', 
          paddingLeft: 'max(1rem, calc((100vw - 1400px) / 2 + 1.5rem))',
          paddingRight: 'max(1rem, calc((100vw - 1400px) / 2 + 1.5rem))',
          paddingTop: '2rem',
          paddingBottom: '4rem'
        }}
      >
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="mb-16 w-full flex flex-col items-center justify-center">
            {/* Structural bounds container with clean matching layout matrices */}
            <div className="flex flex-col gap-0 w-full max-w-[1400px]">
              
              {/* Tier 1: Card 1 and Card 2 flush side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-[260px] w-full">
                <div className="relative w-full h-full overflow-hidden shadow-xl">
                  <div className="stat-card" style={{ borderBottom: 'none', borderRight: 'none', borderRadius: '0px' }}>
                    {i === 4 ? getCard1Slide(4, slideData1) : getCard1Slide(i, slideData1)}
                  </div>
                </div>
                <div className="relative w-full h-full overflow-hidden shadow-xl">
                  <div className="stat-card" style={{ borderBottom: 'none', borderRadius: '0px' }}>
                    {i === 4 ? getCard2Slide(4, slideData2) : getCard2Slide(i, slideData2)}
                  </div>
                </div>
              </div>

              {/* Tier 2: Card 3 full width locked flush against the top rows */}
              <div className="relative w-full h-[340px] overflow-hidden shadow-xl group">
                <div className="stats-right-col" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '0px' }}>
                  {i === 4 ? getCard3Slide(4, slideData3) : getCard3Slide(i, slideData3)}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}