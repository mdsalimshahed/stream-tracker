// src/components/Stats.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { getLowResUrl, getTsDateStr } from '../utils/helpers';
import { getLatestRunWithTimestamp } from './stats/utils';
import { useDynamicTime, useCountUp } from './stats/hooks';
import { CategoryCard } from './stats/CategoryCard';
import { STYLES } from './stats/styles';

// Import our newly abstracted slide components
import { getCard1Slide } from './stats/slides/Card1Slides';
import { getCard2Slide } from './stats/slides/Card2Slides';
import { getCard3Slide } from './stats/slides/Card3Slides';

export default function Stats({ streamData, systemFonts, layoutPrefs }) {
  const [latestBgIndex, setLatestBgIndex] = useState(0);
  
  // --- PERFECT SYNC STATE ---
  const [flipCycle, setFlipCycle] = useState(0);
  const [frontFaceSlide, setFrontFaceSlide] = useState(0);
  const [backFaceSlide, setBackFaceSlide] = useState(1);

  // Fires the exact millisecond the yellow progress bar resets
  const handleAnimationIteration = () => {
    setFlipCycle(prev => prev + 1);
  };

  // Only swap the hidden face's text when the physical rotation is finished
  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    
    if (flipCycle % 2 !== 0) {
      setFrontFaceSlide((flipCycle + 1) % 6);
    } else {
      if (flipCycle > 0) {
        setBackFaceSlide((flipCycle + 1) % 6);
      }
    }
  };

  const flipDegree = flipCycle * 180;

  // --- DATA PROCESSING ---
  const games = useMemo(() =>
    Object.entries(streamData).map(([id, data]) => {
      const cycles = data.cycles || {};
      const totalStreams = Object.values(cycles).reduce((acc, c) => acc + Number(c.stream_count || 0), 0);
      const latestRunInfo = getLatestRunWithTimestamp(cycles);
      const latestRunLabel = latestRunInfo.run ? (latestRunInfo.run.label || 'Ongoing') : 'Ongoing';
      const lastStreamTimestampMs = latestRunInfo.date ? latestRunInfo.date.getTime() : null;
      const lastStreamTimestampRaw = getTsDateStr(latestRunInfo.timestamp);
      
      let latestRunName = '';
      if (latestRunInfo.run) {
        if (latestRunInfo.run.displayName) {
          latestRunName = latestRunInfo.run.displayName;
        } else if (latestRunInfo.cycleId) {
          latestRunName = latestRunInfo.cycleId === 'main' ? 'First Playthrough' : latestRunInfo.cycleId.replace(/_/g, ' ');
        }
      }

      return {
        id, ...data, totalStreams, latestRunLabel, lastStreamTimestampMs,
        lastStreamTimestampRaw, latestRunName, thumbnail_urls: data.thumbnail_urls || []
      };
    }),
  [streamData]);

  const totalStreams = useMemo(() => games.reduce((s, g) => s + g.totalStreams, 0), [games]);
  const totalGames  = games.length;

  const mostRecentGame = useMemo(() =>
    games.reduce((latest, g) => {
      if (!latest || (g.lastStreamTimestampMs && g.lastStreamTimestampMs > (latest.lastStreamTimestampMs || 0))) return g;
      return latest;
    }, null),
  [games]);

  const timeSinceLastStream = useDynamicTime(mostRecentGame?.lastStreamTimestampMs);
  const totalStreamsCount   = useCountUp(totalStreams);
  const totalGamesCount     = useCountUp(totalGames);
  const latestGameImages = mostRecentGame?.thumbnail_urls || [];

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

  const heroThumb = latestGameImages[0] || '';
  const rawLatestBgImage = latestGameImages[latestBgIndex] || heroThumb;
  const latestBgImage = getLowResUrl(rawLatestBgImage, layoutPrefs?.highResImages);

  // Bundle properties required by the slide definitions
  const slideData1 = { totalStreamsCount, totalStreams };
  const slideData2 = { totalGamesCount, totalGames };
  const slideData3 = { latestBgImage, mostRecentGame, timeSinceLastStream };

  return (
    <div 
      className="stats-root" 
      style={{ 
        position: 'relative', height: '100%', width: '100%', overflow: 'hidden',
        '--sz-main': systemFonts?.statsMainCount ?? 4.5, '--sz-main-label': systemFonts?.statsMainLabel ?? 1.1,
        '--sz-title': systemFonts?.statsTitle ?? 2.2, '--sz-sub': systemFonts?.statsSub ?? 1.1, '--sz-label': systemFonts?.statsLabel ?? 1.1,
        '--flex-top': (layoutPrefs?.statsRowSplitRatio ?? 0.6) * 100, '--flex-bottom': (1 - (layoutPrefs?.statsRowSplitRatio ?? 0.6)) * 100,
        '--flex-left': (layoutPrefs?.statsSplitRatio ?? 0.35) * 100, '--flex-right': (1 - (layoutPrefs?.statsSplitRatio ?? 0.35)) * 100,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="stats-scroll custom-scrollbar">
        <div className="stats-top-row fade-up delay-1 shadow-2xl">
          
          <div className="stats-left-col">
            
            {/* --- CARD 1 (Top Left) --- */}
            <div className="card-wrapper-left">
              <div className="flipper" style={{ transform: `rotateY(${flipDegree}deg)` }} onTransitionEnd={handleTransitionEnd}>
                <div className="stat-card flipper-face flip-front">
                  {getCard1Slide(frontFaceSlide, slideData1)}
                </div>
                <div className="stat-card flipper-face flip-back">
                  {getCard1Slide(backFaceSlide, slideData1)}
                </div>
              </div>
            </div>

            {/* PROGRESS DIVIDER */}
            <div className="stats-progress-track">
              <div className="stats-progress-fill" onAnimationIteration={handleAnimationIteration} />
            </div>

            {/* --- CARD 2 (Bottom Left) --- */}
            <div className="card-wrapper-left">
              <div className="flipper" style={{ transform: `rotateY(${flipDegree}deg)` }} onTransitionEnd={handleTransitionEnd}>
                <div className="stat-card flipper-face flip-front">
                  {getCard2Slide(frontFaceSlide, slideData2)}
                </div>
                <div className="stat-card flipper-face flip-back">
                  {getCard2Slide(backFaceSlide, slideData2)}
                </div>
              </div>
            </div>

          </div>

          {/* --- CARD 3 (Right Column) --- */}
          <div className="card-wrapper-right group">
            <div className="flipper" style={{ transform: `rotateY(${flipDegree}deg)` }} onTransitionEnd={handleTransitionEnd}>
              <div className="stats-right-col flipper-face flip-front">
                {getCard3Slide(frontFaceSlide, slideData3)}
              </div>
              <div className="stats-right-col flipper-face flip-back">
                {getCard3Slide(backFaceSlide, slideData3)}
              </div>
            </div>
          </div>
          
        </div>

        <div className="cat-row fade-up delay-2">
          <CategoryCard title="Ongoing" games={games} cssClass="cat-ongoing" highResImages={layoutPrefs?.highResImages} />
          <CategoryCard title="Completed" games={games} cssClass="cat-completed" highResImages={layoutPrefs?.highResImages} />
          <CategoryCard title="Abandoned" games={games} cssClass="cat-abandoned" highResImages={layoutPrefs?.highResImages} />
        </div>
      </div>
    </div>
  );
}