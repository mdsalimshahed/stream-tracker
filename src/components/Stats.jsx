// src/components/Stats.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getLowResUrl, getTsDateStr, parseCustomTimestamp } from '../utils/helpers';
import { getLatestRunWithTimestamp } from './stats/utils';
import { useDynamicTime, useCountUp } from './stats/hooks';
import { CategoryCard } from './stats/CategoryCard';
import { STYLES } from './stats/styles';

import { getCard1Slide } from './stats/slides/Card1Slides';
import { getCard2Slide } from './stats/slides/Card2Slides';
import { getCard3Slide } from './stats/slides/Card3Slides';

const FlipperCard = ({ globalFlipCycle, getSlideContent, slideData, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [localFlipCycle, setLocalFlipCycle] = useState(0);
  const [frontFaceSlide, setFrontFaceSlide] = useState(0);
  const [backFaceSlide, setBackFaceSlide] = useState(1);

  const prevGlobal = useRef(globalFlipCycle);

  useEffect(() => {
    if (globalFlipCycle !== prevGlobal.current) {
      prevGlobal.current = globalFlipCycle;
      if (!isHovered) {
        setLocalFlipCycle(prev => prev + 1);
      }
    }
  }, [globalFlipCycle, isHovered]);

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    
    if (localFlipCycle % 2 !== 0) {
      setFrontFaceSlide((localFlipCycle + 1) % 6);
    } else {
      if (localFlipCycle > 0) {
        setBackFaceSlide((localFlipCycle + 1) % 6);
      }
    }
  };

  const flipDegree = localFlipCycle * 180;

  return (
    <div 
      className="flipper" 
      style={{ transform: `rotateY(${flipDegree}deg)` }} 
      onTransitionEnd={handleTransitionEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`${className} flipper-face flip-front`}>
        {getSlideContent(frontFaceSlide, slideData)}
      </div>
      <div className={`${className} flipper-face flip-back`}>
        {getSlideContent(backFaceSlide, slideData)}
      </div>
    </div>
  );
};

export default function Stats({ streamData, systemFonts, layoutPrefs }) {
  const [latestBgIndex, setLatestBgIndex] = useState(0);
  const [flipCycle, setFlipCycle] = useState(0);

  const handleAnimationIteration = () => {
    setFlipCycle(prev => prev + 1);
  };

  const games = useMemo(() =>
    Object.entries(streamData).map(([id, data]) => {
      const cycles = data.cycles || {};
      const totalStreams = Object.values(cycles).reduce((acc, c) => acc + Number(c.stream_count || 0), 0);
      
      let totalDuration = 0;
      let firstStreamTimestampMs = null;

      Object.values(cycles).forEach(c => {
        (c.timestamps || []).forEach(ts => {
          totalDuration += (ts.duration || 0);
          const d = parseCustomTimestamp(ts).getTime();
          if (!firstStreamTimestampMs || d < firstStreamTimestampMs) {
            firstStreamTimestampMs = d;
          }
        });
      });

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
        id, ...data, totalStreams, totalDuration, firstStreamTimestampMs, latestRunLabel, lastStreamTimestampMs,
        lastStreamTimestampRaw, latestRunName, thumbnail_urls: data.thumbnail_urls || []
      };
    }),
  [streamData]);

  const totalStreams = useMemo(() => games.reduce((s, g) => s + g.totalStreams, 0), [games]);
  const totalGames  = games.length;

  const gamesTimeline = useMemo(() => {
    return [...games]
      .filter(g => g.totalDuration > 0 && g.firstStreamTimestampMs)
      .sort((a, b) => a.firstStreamTimestampMs - b.firstStreamTimestampMs)
      .map(g => {
        const d = new Date(g.firstStreamTimestampMs);
        const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return {
          name: g.game_name,
          hours: parseFloat((g.totalDuration / 3600).toFixed(1)),
          month: monthStr
        };
      });
  }, [games]);

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

  const slideData1 = { totalStreamsCount, totalStreams };
  const slideData2 = { totalGamesCount, totalGames };
  const slideData3 = { latestBgImage, mostRecentGame, timeSinceLastStream, gamesTimeline };

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
            
            <div className="card-wrapper-left">
              <FlipperCard 
                globalFlipCycle={flipCycle} 
                getSlideContent={getCard1Slide} 
                slideData={slideData1} 
                className="stat-card" 
              />
            </div>

            <div className="stats-progress-track">
              <div className="stats-progress-fill" onAnimationIteration={handleAnimationIteration} />
            </div>

            <div className="card-wrapper-left">
              <FlipperCard 
                globalFlipCycle={flipCycle} 
                getSlideContent={getCard2Slide} 
                slideData={slideData2} 
                className="stat-card" 
              />
            </div>

          </div>

          <div className="card-wrapper-right group">
            <FlipperCard 
              globalFlipCycle={flipCycle} 
              getSlideContent={getCard3Slide} 
              slideData={slideData3} 
              className="stats-right-col" 
            />
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