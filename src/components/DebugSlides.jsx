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
        id, ...data, totalStreams, totalDuration, firstStreamTimestampMs, lastStreamTimestampMs,
        lastStreamTimestampRaw, latestRunName, latestRunLabel: latestRunInfo.run?.label || 'Ongoing', thumbnail_urls: data.thumbnail_urls || []
      };
    }),
  [streamData]);

  const totalStreams = useMemo(() => games.reduce((s, g) => s + g.totalStreams, 0), [games]);
  const totalGames = games.length;
  const totalDurationOverall = useMemo(() => games.reduce((acc, g) => acc + g.totalDuration, 0), [games]);

  const statusData = useMemo(() => {
    let cumC = 0, cumO = 0, cumA = 0;
    games.forEach(g => {
      const h = g.totalDuration / 3600;
      if (g.latestRunLabel === 'Completed') cumC += h;
      else if (g.latestRunLabel === 'Ongoing') cumO += h;
      else if (g.latestRunLabel === 'Abandoned') cumA += h;
    });
    return [
      { name: 'Ongoing', hours: parseFloat(cumO.toFixed(1)), color: '#3ddc84' },
      { name: 'Completed', hours: parseFloat(cumC.toFixed(1)), color: '#f5a623' },
      { name: 'Abandoned', hours: parseFloat(cumA.toFixed(1)), color: '#ff5c5c' },
    ];
  }, [games]);

  // Generate a master list of all unique stream dates for Slide 9's X-Axis
  const progressionDates = useMemo(() => {
    const s = new Set();
    games.forEach(g => Object.values(g.cycles||{}).forEach(c => (c.timestamps||[]).forEach(ts => {
      const d = parseCustomTimestamp(ts).getTime();
      if (d > 0) s.add(d);
    })));
    return Array.from(s).sort((a,b) => a-b);
  }, [games]);

  const streamProgressionLines = useMemo(() => {
    const dateToIndex = new Map(progressionDates.map((d, i) => [d, i]));

    return games
      .filter(g => g.totalDuration > 0)
      .map(g => {
        let cumHours = 0;
        const allStreams = [];
        
        Object.values(g.cycles || {}).forEach(c => {
          (c.timestamps || []).forEach(ts => {
            const d = parseCustomTimestamp(ts).getTime();
            if (d > 0) allStreams.push({ date: d, duration: ts.duration || 0 });
          });
        });

        allStreams.sort((a, b) => a.date - b.date);

        const dataPoints = allStreams.map(ts => {
          cumHours += ts.duration / 3600;
          return {
            xIndex: dateToIndex.get(ts.date),
            cumulativeHours: parseFloat(cumHours.toFixed(1)),
            date: ts.date,
            gameName: g.game_name
          };
        });

        let color = "#e8c87a";
        if (g.latestRunLabel === 'Completed') color = "#f5a623";
        if (g.latestRunLabel === 'Ongoing') color = "#3ddc84";
        if (g.latestRunLabel === 'Abandoned') color = "#ff5c5c";

        return { gameName: g.game_name, color, data: dataPoints };
      });
  }, [games, progressionDates]);

  const gamesTimeline = useMemo(() => {
    return [...games]
      .filter(g => g.totalDuration > 0 && g.firstStreamTimestampMs)
      .sort((a, b) => a.firstStreamTimestampMs - b.firstStreamTimestampMs)
      .map((g, index) => {
        const d = new Date(g.firstStreamTimestampMs);
        const fullDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const totalSec = g.totalDuration;
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const runTime = `${hours}h ${mins}m`;

        return {
          index,
          name: g.game_name,
          hours: parseFloat((g.totalDuration / 3600).toFixed(1)),
          runTime,
          fullDate,
          month: monthStr,
          status: g.latestRunLabel,
          image: g.thumbnail_urls?.[0] ? getLowResUrl(g.thumbnail_urls[0], layoutPrefs?.highResImages) : 'https://placehold.co/100x100/1e293b/475569?text=Game'
        };
      });
  }, [games, layoutPrefs?.highResImages]);

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
          <p className="text-white/60">Previewing Slide 3, Slide 6, and Slide 9 with full interactive progression data.</p>
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