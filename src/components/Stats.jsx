// src/components/Stats.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { getLowResUrl, getTsDateStr } from '../utils/helpers';
import { CrossfadeImage } from './common/UIComponents';
import { getLatestRunWithTimestamp } from './stats/utils';
import { useDynamicTime, useCountUp } from './stats/hooks';
import { CategoryCard } from './stats/CategoryCard';
import { STYLES } from './stats/styles';

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
    // Only trigger on the container's transform transition, ignore children
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    
    if (flipCycle % 2 !== 0) {
      // Back is visible. Front is hidden. Safe to silently update front.
      setFrontFaceSlide((flipCycle + 1) % 6);
    } else {
      // Front is visible. Back is hidden. Safe to silently update back.
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

  // =========================================================
  // --- 18 EXPLICIT SLIDES (Encapsulated in .slide-container) ---
  // =========================================================

  const renderPlaceholder = (num) => (
    <div className="slide-container items-center justify-center">
      <span className="font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md text-2xl lg:text-3xl">
        Slide {num}
      </span>
    </div>
  );

  // --- CARD 1 (Top Left) ---
  const getCard1Slide = (index) => {
    switch (index) {
      case 0: return (
        <div className="slide-container">
          <div className="stat-number top-number">{totalStreamsCount.toLocaleString()}</div>
          <div className="stat-label">{totalStreams === 1 ? 'Stream' : 'Streams'}</div>
        </div>
      );
      case 1: return renderPlaceholder(4);
      case 2: return renderPlaceholder(7);
      case 3: return renderPlaceholder(10);
      case 4: return renderPlaceholder(13);
      case 5: return renderPlaceholder(16);
      default: return null;
    }
  };

  // --- CARD 2 (Bottom Left) ---
  const getCard2Slide = (index) => {
    switch (index) {
      case 0: return (
        <div className="slide-container">
          <div className="stat-number top-number">{totalGamesCount}</div>
          <div className="stat-label">{totalGames === 1 ? 'Game in Library' : 'Games in Library'}</div>
        </div>
      );
      case 1: return renderPlaceholder(5);
      case 2: return renderPlaceholder(8);
      case 3: return renderPlaceholder(11);
      case 4: return renderPlaceholder(14);
      case 5: return renderPlaceholder(17);
      default: return null;
    }
  };

  // --- CARD 3 (Right Column) ---
  const getCard3Slide = (index) => {
    switch (index) {
      case 0: return (
        <div className="slide-container justify-end">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
          <div className="latest-bg">
            <CrossfadeImage src={latestBgImage} alt="latest game" className="w-full h-full" imgClassName="object-cover" duration={700} />
          </div>
          <div className="latest-content">
            <div className="stat-number drop-shadow-xl latest-title transition-colors duration-300">
              {mostRecentGame?.game_name || '—'}
            </div>
            <div className="stat-sub latest-sub-3">{mostRecentGame?.latestRunName || ''}</div>
            <div className="stat-sub latest-sub-1">Last streamed: <span className="latest-sub-time">{timeSinceLastStream}</span></div>
            <div className="stat-sub latest-sub-2">{mostRecentGame?.lastStreamTimestampRaw ? `On ${mostRecentGame.lastStreamTimestampRaw}` : 'Unknown'}</div>
          </div>
        </div>
      );
      case 1: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 6</span></div>;
      case 2: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 9</span></div>;
      case 3: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 12</span></div>;
      case 4: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 15</span></div>;
      case 5: return <div className="slide-container items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Slide 18</span></div>;
      default: return null;
    }
  };

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
                  {getCard1Slide(frontFaceSlide)}
                </div>
                <div className="stat-card flipper-face flip-back">
                  {getCard1Slide(backFaceSlide)}
                </div>
              </div>
            </div>

            {/* PROGRESS DIVIDER */}
            <div className="stats-progress-track">
              {/* Triggers flip safely on animation repeat */}
              <div className="stats-progress-fill" onAnimationIteration={handleAnimationIteration} />
            </div>

            {/* --- CARD 2 (Bottom Left) --- */}
            <div className="card-wrapper-left">
              <div className="flipper" style={{ transform: `rotateY(${flipDegree}deg)` }} onTransitionEnd={handleTransitionEnd}>
                <div className="stat-card flipper-face flip-front">
                  {getCard2Slide(frontFaceSlide)}
                </div>
                <div className="stat-card flipper-face flip-back">
                  {getCard2Slide(backFaceSlide)}
                </div>
              </div>
            </div>

          </div>

          {/* --- CARD 3 (Right Column) --- */}
          <div className="card-wrapper-right group">
            <div className="flipper" style={{ transform: `rotateY(${flipDegree}deg)` }} onTransitionEnd={handleTransitionEnd}>
              {/* Uses your exact stats-right-col class */}
              <div className="stats-right-col flipper-face flip-front">
                {getCard3Slide(frontFaceSlide)}
              </div>
              <div className="stats-right-col flipper-face flip-back">
                {getCard3Slide(backFaceSlide)}
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