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
  // ─── Base game list ────────────────────────────────────────────────────────
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

  const hourlyStreamData = useMemo(() => {
    const hours = Array.from({length: 24}, (_, i) => ({ 
      hour: i, 
      displayHour: i === 0 ? '12AM' : i < 12 ? `${i}AM` : i === 12 ? '12PM' : `${i-12}PM`,
      count: 0 
    }));
    
    games.forEach(g => {
      Object.values(g.cycles || {}).forEach(c => {
        (c.timestamps || []).forEach(ts => {
          const d = parseCustomTimestamp(ts);
          if (d.getTime() > 0) {
            const hr = d.getHours();
            hours[hr].count += 1;
          }
        });
      });
    });
    return hours;
  }, [games]);

  const dowStreamData = useMemo(() => {
    const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mapDay = (d) => d === 0 ? 6 : d - 1; 

    const dow = Array.from({length: 7}, (_, i) => ({
      dayIndex: i,
      displayDay: displayDays[i],
      count: 0
    }));

    games.forEach(g => {
      Object.values(g.cycles || {}).forEach(c => {
        (c.timestamps || []).forEach(ts => {
          const d = parseCustomTimestamp(ts);
          if (d.getTime() > 0) {
            const day = mapDay(d.getDay());
            dow[day].count += 1;
          }
        });
      });
    });
    return dow;
  }, [games]);

  // ─── Daily Splitting & EXACT Seconds Streak/Break Calculations ────────
  const { dailyStreamHours, streakBreakStats } = useMemo(() => {
    const allStreamsExact = [];
    games.forEach(g => {
      Object.values(g.cycles || {}).forEach(c => {
        (c.timestamps || []).forEach(ts => {
          const startMs = parseCustomTimestamp(ts).getTime();
          if (startMs > 0) {
            allStreamsExact.push({ 
              startMs, 
              duration: ts.duration || 0, 
              endMs: startMs + (ts.duration || 0) * 1000 
            });
          }
        });
      });
    });

    allStreamsExact.sort((a, b) => a.startMs - b.startMs);

    const mergedStreams = [];
    allStreamsExact.forEach(s => {
      if (mergedStreams.length === 0) {
        mergedStreams.push({ ...s });
      } else {
        const last = mergedStreams[mergedStreams.length - 1];
        if (s.startMs <= last.endMs) {
          last.endMs = Math.max(last.endMs, s.endMs);
        } else {
          mergedStreams.push({ ...s });
        }
      }
    });

    let maxBreakSecs = 0;
    let maxBreakStartMs = null;
    let maxBreakEndMs = null;
    let isActiveBreak = false;

    for (let i = 1; i < mergedStreams.length; i++) {
      const brkStart = mergedStreams[i-1].endMs;
      const brkEnd = mergedStreams[i].startMs;
      const brkSecs = (brkEnd - brkStart) / 1000;
      if (brkSecs > maxBreakSecs) {
        maxBreakSecs = brkSecs;
        maxBreakStartMs = brkStart;
        maxBreakEndMs = brkEnd;
        isActiveBreak = false;
      }
    }

    const nowMs = Date.now();
    if (mergedStreams.length > 0) {
      const lastEndMs = mergedStreams[mergedStreams.length - 1].endMs;
      if (nowMs > lastEndMs) {
        const activeBreakSecs = (nowMs - lastEndMs) / 1000;
        if (activeBreakSecs > maxBreakSecs) {
          maxBreakSecs = activeBreakSecs;
          maxBreakStartMs = lastEndMs;
          maxBreakEndMs = nowMs;
          isActiveBreak = true;
        }
      }
    }

    const dailyMap = new Map();
    const getMidnight = (ms) => {
      const d = new Date(ms);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    allStreamsExact.forEach(stream => {
      let currentStart = stream.startMs;
      let remainingSeconds = stream.duration;
      let loopLimit = 48; 
      
      while (remainingSeconds > 0 && loopLimit > 0) {
        const currentMidnight = getMidnight(currentStart);
        const nextMidnight = currentMidnight + 86400000;
        const timeUntilNextMidnight = (nextMidnight - currentStart) / 1000;

        const secondsInCurrentDay = Math.min(remainingSeconds, timeUntilNextMidnight);
        dailyMap.set(currentMidnight, (dailyMap.get(currentMidnight) || 0) + secondsInCurrentDay);

        remainingSeconds -= secondsInCurrentDay;
        currentStart = nextMidnight;
        loopLimit--;
      }
    });

    const sortedDays = Array.from(dailyMap.keys()).sort((a, b) => a - b);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    
    const continuousDailyStreamHours = [];
    if (sortedDays.length > 0) {
      let currentDate = new Date(sortedDays[0]);
      const lastStreamMs = sortedDays[sortedDays.length - 1];
      const endDateMs = Math.max(lastStreamMs, todayMs);
      const endDate = new Date(endDateMs);

      while (currentDate <= endDate) {
        const t = currentDate.getTime();
        const rawSecs = dailyMap.has(t) ? dailyMap.get(t) : 0;
        const hrs = parseFloat((rawSecs / 3600).toFixed(2));
        
        continuousDailyStreamHours.push({
          dateMs: t,
          displayDate: `${currentDate.getDate()} ${currentDate.toLocaleString('en-US', { month: 'short' })}`,
          rawSeconds: rawSecs,
          hours: hrs
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const streaks = [];
    let currentStreakDaysList = [];

    for (let i = 0; i < sortedDays.length; i++) {
       const day = sortedDays[i];
       if (i === 0) {
          currentStreakDaysList = [day];
       } else {
          const prevDay = sortedDays[i-1];
          if (Math.round((day - prevDay) / 86400000) === 1) {
             currentStreakDaysList.push(day);
          } else {
             streaks.push([...currentStreakDaysList]);
             currentStreakDaysList = [day];
          }
       }
    }
    if (currentStreakDaysList.length > 0) {
       streaks.push([...currentStreakDaysList]);
    }

    let maxStreakSecs = 0;
    let maxStreakStartMs = null;
    let maxStreakEndMs = null;

    streaks.forEach(streakDays => {
       const streamsInStreak = allStreamsExact.filter(s => streakDays.includes(getMidnight(s.startMs)));
       if (streamsInStreak.length > 0) {
           const st = Math.min(...streamsInStreak.map(s => s.startMs));
           const en = Math.max(...streamsInStreak.map(s => s.endMs));
           const secs = (en - st) / 1000;
           if (secs > maxStreakSecs) {
               maxStreakSecs = secs;
               maxStreakStartMs = st;
               maxStreakEndMs = en;
           }
       }
    });

    return {
      dailyStreamHours: continuousDailyStreamHours,
      streakBreakStats: {
        longestStreakSecs: maxStreakSecs,
        maxStreakStartMs,
        maxStreakEndMs,
        longestBreakSecs: maxBreakSecs,
        maxBreakStartMs,
        maxBreakEndMs,
        isActiveBreak
      }
    };
  }, [games]);

  // ─── Individual Streams Chronological & Extremes ────────
  const { allStreamsChronological, longestStream, shortestStream } = useMemo(() => {
    let streams = [];
    games.forEach(g => {
      Object.values(g.cycles || {}).forEach(c => {
        let runName = c.displayName || (c.id === 'main' ? 'First Playthrough' : (c.id || '').replace(/_/g, ' '));

        (c.timestamps || []).forEach((ts, idx) => {
          const startMs = parseCustomTimestamp(ts).getTime();
          if (startMs > 0 && ts.duration > 0) {
            
            let baseTitle = ts.title || `${g.game_name} - Stream #${idx + 1}`;
            let finalTitle = (runName && runName !== 'First Playthrough') 
              ? `${baseTitle} (${runName})` 
              : baseTitle;

            streams.push({
              startMs,
              duration: ts.duration,
              gameName: g.game_name,
              status: g.latestRunLabel, 
              cycleName: runName,
              streamTitle: finalTitle,
              thumbnails: g.thumbnail_urls || [],
              displayDate: getTsDateStr(ts),
              hours: parseFloat((ts.duration / 3600).toFixed(2))
            });
          }
        });
      });
    });

    streams.sort((a, b) => a.startMs - b.startMs);
    const chrono = streams.map((s, i) => ({ ...s, index: i + 1 }));

    let longest = null;
    let shortest = null;
    
    if (chrono.length > 0) {
      longest = chrono.reduce((prev, curr) => curr.duration > prev.duration ? curr : prev, chrono[0]);
      shortest = chrono.reduce((prev, curr) => curr.duration < prev.duration ? curr : prev, chrono[0]);
    }

    return { allStreamsChronological: chrono, longestStream: longest, shortestStream: shortest };
  }, [games]);

  const statusData = useMemo(() => {
    const sums = { Completed: 0, Ongoing: 0, Abandoned: 0 };
    games.forEach(g => {
      const label = g.latestRunLabel || 'Ongoing';
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

  const streamProgressionLines = useMemo(() => {
    const dateToIndex = new Map(progressionDates.map((d, i) => [d, i]));

    return games
      .filter(g => g.totalDuration > 0)
      .map(g => {
        let cumSecs = 0; 
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
            rawSeconds: cumSecs,
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

  const mostRecentGame = useMemo(() =>
    games.reduce((latest, g) => {
      if (!latest || (g.lastStreamTimestampMs && g.lastStreamTimestampMs > (latest.lastStreamTimestampMs || 0))) return g;
      return latest;
    }, null),
  [games]);

  const tagFrequencies = useMemo(() => {
    const counts = {};
    games.forEach(g => {
      if (g.details && g.details.tags) {
        const tags = g.details.tags.split(',').map(t => t.trim());
        tags.forEach(t => {
          if (t && t.toLowerCase() !== 'unknown' && t.split(' ').length <= 2 && /^[a-zA-Z\s\-]+$/.test(t)) {
            counts[t] = (counts[t] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100); 
  }, [games]);

  const timeSinceLastStream = useDynamicTime(mostRecentGame?.lastStreamTimestampMs);
  const heroThumb = mostRecentGame?.thumbnail_urls?.[0] || '';
  const latestBgImage = getLowResUrl(heroThumb, layoutPrefs?.highResImages);

  const data1 = { 
    totalStreamsCount: totalStreams, 
    totalStreams, 
    totalDuration: totalDurationOverall,
    hourlyStreamData,
    longestStreakSecs: streakBreakStats.longestStreakSecs,
    maxStreakStartMs: streakBreakStats.maxStreakStartMs,
    maxStreakEndMs: streakBreakStats.maxStreakEndMs,
    latestBgImage
  };
  
  const data2 = { 
    totalGamesCount: totalGames, 
    totalGames, 
    statusData,
    dowStreamData,
    longestBreakSecs: streakBreakStats.longestBreakSecs,
    maxBreakStartMs: streakBreakStats.maxBreakStartMs,
    maxBreakEndMs: streakBreakStats.maxBreakEndMs,
    isActiveBreak: streakBreakStats.isActiveBreak,
    latestBgImage
  };
  
  const data3 = { 
    latestBgImage, 
    mostRecentGame, 
    timeSinceLastStream, 
    gamesTimeline, 
    streamProgressionLines, 
    progressionDates,
    dailyStreamHours,
    tagFrequencies
  };

  const data4 = {
    longestStream,
    shortestStream,
    allStreamsChronological,
    highResImages: layoutPrefs?.highResImages
  };

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
                    {i === 4 ? getCard1Slide(4, data4) : getCard1Slide(i, data1)}
                  </div>
                </div>
                <div className="stats-progress-track"><div className="stats-progress-fill" style={{ width: '100%', opacity: 0.5 }} /></div>
                <div className="card-wrapper-left relative">
                  <div className="stat-card">
                    {i === 4 ? getCard2Slide(4, data4) : getCard2Slide(i, data2)}
                  </div>
                </div>
              </div>
              <div className="card-wrapper-right relative group">
                <div className="stats-right-col">
                  {i === 4 ? getCard3Slide(4, data4) : getCard3Slide(i, data3)}
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