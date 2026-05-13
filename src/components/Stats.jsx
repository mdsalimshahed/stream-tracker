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

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [latestGameImages]);

  const heroThumb = latestGameImages[0] || '';
  const rawLatestBgImage = latestGameImages[latestBgIndex] || heroThumb;
  const latestBgImage = getLowResUrl(rawLatestBgImage, layoutPrefs?.highResImages);

  return (
    <div 
      className="stats-root" 
      style={{ 
        position: 'relative', 
        height: '100%', 
        width: '100%', 
        overflow: 'hidden',
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

      <div className="stats-scroll custom-scrollbar">
        <div className="stats-top-row fade-up delay-1 shadow-2xl">
          <div className="stats-left-col">
            
            <div className="stat-card">
              <div className="stat-number top-number">
                {totalStreamsCount.toLocaleString()}
              </div>
              <div className="stat-label">{totalStreams === 1 ? 'Stream' : 'Streams'}</div>
            </div>

            {/* 5-SECOND PROGRESS DIVIDER */}
            <div className="stats-progress-track">
              <div className="stats-progress-fill" />
            </div>

            <div className="stat-card">
              <div className="stat-number top-number">
                {totalGamesCount}
              </div>
              <div className="stat-label">
                {totalGames === 1 ? 'Game in Library' : 'Games in Library'}
              </div>
            </div>

          </div>

          <div className="stats-right-col group">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
            <div className="latest-bg">
              <CrossfadeImage 
                src={latestBgImage} 
                alt="latest game" 
                className="w-full h-full" 
                imgClassName="object-cover" 
                duration={700}
              />
            </div>
            <div className="latest-content">
              <div className="stat-number drop-shadow-xl latest-title transition-colors duration-300">
                {mostRecentGame?.game_name || '—'}
              </div>
              <div className="stat-sub latest-sub-3">
                {mostRecentGame?.latestRunName || ''}
              </div>
              <div className="stat-sub latest-sub-1">
                Last streamed: <span className="latest-sub-time">{timeSinceLastStream}</span>
              </div>
              <div className="stat-sub latest-sub-2">
                {mostRecentGame?.lastStreamTimestampRaw ? `On ${mostRecentGame.lastStreamTimestampRaw}` : 'Unknown'}
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
