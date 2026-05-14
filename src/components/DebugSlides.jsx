// src/components/DebugSlides.jsx
import React, { useMemo } from 'react';
import { getLatestRunWithTimestamp } from './stats/utils';
import { getLowResUrl, getTsDateStr } from '../utils/helpers';
import { useDynamicTime } from './stats/hooks';
import { STYLES } from './stats/styles';

import { getCard1Slide } from './stats/slides/Card1Slides';
import { getCard2Slide } from './stats/slides/Card2Slides';
import { getCard3Slide } from './stats/slides/Card3Slides';

export default function DebugSlides({ streamData, layoutPrefs, systemFonts }) {
  // Compute Data (Identical to Stats.jsx)
  const games = useMemo(() =>
    Object.entries(streamData).map(([id, data]) => {
      const cycles = data.cycles || {};
      const totalStreams = Object.values(cycles).reduce((acc, c) => acc + Number(c.stream_count || 0), 0);
      const latestRunInfo = getLatestRunWithTimestamp(cycles);
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
        id, ...data, totalStreams, lastStreamTimestampMs,
        lastStreamTimestampRaw, latestRunName, thumbnail_urls: data.thumbnail_urls || []
      };
    }),
  [streamData]);

  const totalStreams = useMemo(() => games.reduce((s, g) => s + g.totalStreams, 0), [games]);
  const totalGames = games.length;

  const mostRecentGame = useMemo(() =>
    games.reduce((latest, g) => {
      if (!latest || (g.lastStreamTimestampMs && g.lastStreamTimestampMs > (latest.lastStreamTimestampMs || 0))) return g;
      return latest;
    }, null),
  [games]);

  const timeSinceLastStream = useDynamicTime(mostRecentGame?.lastStreamTimestampMs);
  const heroThumb = mostRecentGame?.thumbnail_urls?.[0] || '';
  const latestBgImage = getLowResUrl(heroThumb, layoutPrefs?.highResImages);

  const data1 = { totalStreamsCount: totalStreams, totalStreams };
  const data2 = { totalGamesCount: totalGames, totalGames };
  const data3 = { latestBgImage, mostRecentGame, timeSinceLastStream };

  return (
    <div className="stats-root overflow-y-auto custom-scrollbar h-full w-full p-8"
      style={{
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
      <div className="max-w-7xl mx-auto pb-16">
        <h1 className="text-3xl font-bold mb-4 text-white tracking-tight">Slide Debug Panel</h1>
        <p className="text-white/60 mb-12">Previewing the trios (Card 1, Card 2, and Card 3) stacked exactly as they appear on the Stats page layout.</p>

        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="mb-16">
            <h2 className="text-xl font-bold mb-4 text-[#e8c87a]">Slide Trio {i + 1} (Index {i})</h2>
            
            {/* Mimicking the Stats Top Row layout */}
            <div className="stats-top-row shadow-2xl min-h-[400px] lg:min-h-[500px]">
              
              {/* Left Column (Card 1 & Card 2) */}
              <div className="stats-left-col">
                {/* Card 1 */}
                <div className="card-wrapper-left relative">
                  <div className="stat-card">
                    {getCard1Slide(i, data1)}
                  </div>
                </div>

                {/* Progress Divider */}
                <div className="stats-progress-track">
                  <div className="stats-progress-fill" style={{ width: '100%', animation: 'none', opacity: 0.5 }} />
                </div>

                {/* Card 2 */}
                <div className="card-wrapper-left relative">
                  <div className="stat-card">
                    {getCard2Slide(i, data2)}
                  </div>
                </div>
              </div>

              {/* Right Column (Card 3) */}
              <div className="card-wrapper-right relative group">
                <div className="stats-right-col">
                  {getCard3Slide(i, data3)}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}