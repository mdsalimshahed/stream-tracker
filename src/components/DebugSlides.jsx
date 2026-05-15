// src/components/DebugSlides.jsx
import React, { useMemo } from 'react';
import { getLatestRunWithTimestamp } from './stats/utils';
import { getLowResUrl, getTsDateStr, parseCustomTimestamp } from '../utils/helpers';
import { useDynamicTime } from './stats/hooks';
import { STYLES } from './stats/styles';

import { getCard1Slide } from './stats/slides/Card1Slides';
import { getCard2Slide } from './stats/slides/Card2Slides';
import { getCard3Slide } from './stats/slides/Card3Slides';

export default function DebugSlides({ streamData, layoutPrefs, systemFonts }) {
  // ─── Base game list (Mirrored from Stats.jsx) ─────────────────────────────
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
          if (d > 0 && (!firstStreamTimestampMs || d < firstStreamTimestampMs)) {
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
        latestRunName = latestRunInfo.run.displayName || 
          (latestRunInfo.cycleId === 'main' ? 'First Playthrough' : (latestRunInfo.cycleId || '').replace(/_/g, ' '));
      }

      return {
        id, ...data, totalStreams, totalDuration, firstStreamTimestampMs, 
        latestRunLabel, lastStreamTimestampMs, lastStreamTimestampRaw, latestRunName, 
        thumbnail_urls: data.thumbnail_urls || []
      };
    }),
  [streamData]);

  // ─── Shared Calculations ──────────────────────────────────────────────────
  const totalStreams = useMemo(() => games.reduce((s, g) => s + g.totalStreams, 0), [games]);
  const totalGames = games.length;
  const totalDurationOverall = useMemo(() => games.reduce((acc, g) => acc + g.totalDuration, 0), [games]);

  const statusData = useMemo(() => {
    const sums = { Completed: 0, Ongoing: 0, Abandoned: 0 };
    games.forEach(g => {
      const label = g.latestRunLabel || 'Ongoing';
      // Keep it in raw seconds here instead of dividing by 3600
      sums[label] = (sums[label] || 0) + g.totalDuration;
    });
    return [
      { name: 'Ongoing',   rawSeconds: sums.Ongoing,   hours: parseFloat((sums.Ongoing / 3600).toFixed(1)), color: '#3ddc84' },
      { name: 'Completed', rawSeconds: sums.Completed, hours: parseFloat((sums.Completed / 3600).toFixed(1)), color: '#f5a623' },
      { name: 'Abandoned', rawSeconds: sums.Abandoned, hours: parseFloat((sums.Abandoned / 3600).toFixed(1)), color: '#ff5c5c' },
    ];
  }, [games]);

  const progressionDates = useMemo(() => {
    const s = new Set();
    games.forEach(g => Object.values(g.cycles||{}).forEach(c => (c.timestamps||[]).forEach(ts => {
      const d = parseCustomTimestamp(ts).getTime();
      if (d > 0) s.add(d);
    })));
    return Array.from(s).sort((a,b) => a-b);
  }, [games]);

  // ─── Cumulative Session Lines (Slide 9) ───────────────────────────────────
  const streamProgressionLines = useMemo(() => {
    const dateToIndex = new Map(progressionDates.map((d, i) => [d, i]));

    return games
      .filter(g => g.totalDuration > 0)
      .map(g => {
        let cumSecs = 0; // Tracking raw seconds to prevent precision loss
        const allStreams = [];
        
        Object.values(g.cycles || {}).forEach(c => {
          (c.timestamps || []).forEach(ts => {
            const d = parseCustomTimestamp(ts).getTime();
            if (d > 0) allStreams.push({ date: d, duration: ts.duration || 0 });
          });
        });

        allStreams.sort((a, b) => a.date - b.date);

        const dataPoints = allStreams.map(ts => {
          cumSecs += ts.duration;
          return {
            xIndex: dateToIndex.get(ts.date),
            cumulativeHours: parseFloat((cumSecs / 3600).toFixed(2)),
            rawSeconds: cumSecs, // Passed for accurate tooltip formatting
            date: ts.date,
            gameName: g.game_name
          };
        });

        const color = g.latestRunLabel === 'Completed' ? '#f5a623' : 
                      g.latestRunLabel === 'Ongoing'   ? '#3ddc84' : '#ff5c5c';

        return { 
          gameName: g.game_name, 
          color, 
          status: g.latestRunLabel,
          image: getLowResUrl(g.thumbnail_urls?.[0] || '', layoutPrefs?.highResImages),
          data: dataPoints 
        };
      });
  }, [games, progressionDates, layoutPrefs?.highResImages]);

  // ─── Timeline (Slide 6) ──────────────────────────────────────────────────
  const gamesTimeline = useMemo(() => {
    return [...games]
      .filter(g => g.totalDuration > 0 && g.firstStreamTimestampMs)
      .sort((a, b) => a.firstStreamTimestampMs - b.firstStreamTimestampMs)
      .map((g, index) => {
        const d = new Date(g.firstStreamTimestampMs);
        return {
          index,
          name: g.game_name,
          hours: parseFloat((g.totalDuration / 3600).toFixed(1)),
          rawSeconds: g.totalDuration,
          fullDate: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          status: g.latestRunLabel,
          image: getLowResUrl(g.thumbnail_urls?.[0] || '', layoutPrefs?.highResImages),
        };
      });
  }, [games, layoutPrefs?.highResImages]);

  // ─── Hero Data ────────────────────────────────────────────────────────────
  const mostRecentGame = useMemo(() =>
    games.reduce((latest, g) => {
      if (!latest || (g.lastStreamTimestampMs && g.lastStreamTimestampMs > (latest.lastStreamTimestampMs || 0))) return g;
      return latest;
    }, null),
  [games]);

  const timeSinceLastStream = useDynamicTime(mostRecentGame?.lastStreamTimestampMs);
  const heroThumb = mostRecentGame?.thumbnail_urls?.[0] || '';
  const latestBgImage = getLowResUrl(heroThumb, layoutPrefs?.highResImages);

  const data1 = { totalStreamsCount: totalStreams, totalStreams, totalDuration: totalDurationOverall };
  const data2 = { totalGamesCount: totalGames, totalGames, statusData };
  const data3 = { latestBgImage, mostRecentGame, timeSinceLastStream, gamesTimeline, streamProgressionLines, progressionDates };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white tracking-tight">Slide Debug Panel</h1>
          <p className="text-white/60">Previewing Slide 3, Slide 6, and Slide 9 with synced data logic.</p>
        </div>

        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="mb-14">
            <h2 className="text-xl font-bold text-[#e8c87a] mb-4">Slide Trio {i + 1}</h2>
            <div className="stats-top-row shadow-2xl" style={{ height: '350px', flex: 'none' }}>
              <div className="stats-left-col">
                <div className="card-wrapper-left relative"><div className="stat-card">{getCard1Slide(i, data1)}</div></div>
                <div className="stats-progress-track"><div className="stats-progress-fill" style={{ width: '100%', opacity: 0.5 }} /></div>
                <div className="card-wrapper-left relative"><div className="stat-card">{getCard2Slide(i, data2)}</div></div>
              </div>
              <div className="card-wrapper-right relative group"><div className="stats-right-col">{getCard3Slide(i, data3)}</div></div>
            </div>
          </div>
        ))}
        <div className="h-12 w-full"></div>
      </div>
    </div>
  );
}