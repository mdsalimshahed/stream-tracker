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
    <div className="stats-root"
      style={{
        position: 'relative', height: '100%', width: '100%', overflow: 'hidden',
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
      
      <div className="stats-scroll custom-scrollbar" style={{ overflowY: 'auto', display: 'block' }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="mb-14">
            <div className="stats-top-row shadow-2xl lg:h-[350px] flex-none">
              <div className="stats-left-col">
                <div className="card-wrapper-left relative">
                  <div className="stat-card">
                    {i === 4 ? getCard1Slide(4, slideData1) : getCard1Slide(i, slideData1)}
                  </div>
                </div>
                <div className="stats-progress-track">
                  <div className="stats-progress-fill" style={{ width: '100%', opacity: 0.5, animation: 'none' }} />
                </div>
                <div className="card-wrapper-left relative">
                  <div className="stat-card">
                    {i === 4 ? getCard2Slide(4, slideData2) : getCard2Slide(i, slideData2)}
                  </div>
                </div>
              </div>
              <div className="card-wrapper-right relative group">
                <div className="stats-right-col" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  {i === 4 ? getCard3Slide(4, slideData3) : getCard3Slide(i, slideData3)}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="h-12 w-full"></div>
      </div>
    </div>
  );
}