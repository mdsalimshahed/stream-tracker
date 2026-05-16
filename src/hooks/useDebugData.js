// src/hooks/useDebugData.js
import { useMemo } from 'react';
import { getLatestRunWithTimestamp } from '../components/stats/utils';
import { getLowResUrl, getTsDateStr, parseCustomTimestamp } from '../utils/helpers';
import { useDynamicTime } from '../components/stats/hooks';

export function useDebugData(streamData, layoutPrefs) {
  // ─── 1. Single Pass Flattening & Game Meta Extraction ────────
  // We parse dates and calculate durations exactly ONCE.
  const { games, flatStreams } = useMemo(() => {
    const processedGames = [];
    const allFlat = [];

    Object.entries(streamData).forEach(([id, data]) => {
      const cycles = data.cycles || {};
      let totalStreams = 0;
      let totalDuration = 0;
      let firstStreamTimestampMs = null;

      const latestRunInfo = getLatestRunWithTimestamp(cycles);
      const latestRunLabel = latestRunInfo.run ? (latestRunInfo.run.label || 'Ongoing') : 'Ongoing';
      const lastStreamTimestampMs = latestRunInfo.date ? latestRunInfo.date.getTime() : null;
      const lastStreamTimestampRaw = getTsDateStr(latestRunInfo.timestamp);

      let latestRunName = latestRunInfo.run?.displayName || 
        (latestRunInfo.cycleId === 'main' ? 'First Playthrough' : (latestRunInfo.cycleId || '').replace(/_/g, ' '));

      Object.entries(cycles).forEach(([cycleId, c]) => {
        totalStreams += Number(c.stream_count || 0);
        let runName = c.displayName || (cycleId === 'main' ? 'First Playthrough' : (cycleId || '').replace(/_/g, ' '));

        (c.timestamps || []).forEach((ts, idx) => {
          const duration = ts.duration || 0;
          totalDuration += duration;
          
          const startMs = parseCustomTimestamp(ts).getTime();
          if (startMs > 0) {
            if (!firstStreamTimestampMs || startMs < firstStreamTimestampMs) {
              firstStreamTimestampMs = startMs;
            }

            let actualDur = duration;
            if (ts.startTime && ts.endTime) {
              actualDur = Math.floor((ts.endTime - ts.startTime) / 1000);
            }
            
            let baseTitle = ts.title || `${data.game_name} - Stream #${idx + 1}`;
            let streamTitle = (runName && runName !== 'First Playthrough') ? `${baseTitle} (${runName})` : baseTitle;

            allFlat.push({
              gameId: id,
              gameName: data.game_name,
              thumbnails: data.thumbnail_urls || [],
              cycleName: runName,
              status: latestRunLabel,
              streamTitle,
              startMs,
              duration,
              endMs: startMs + duration * 1000,
              actualDur,
              diff: (actualDur > 0 || duration > 0) ? actualDur - duration : 0,
              displayDate: getTsDateStr(ts),
              hours: parseFloat((duration / 3600).toFixed(2))
            });
          }
        });
      });

      processedGames.push({
        id, ...data, totalStreams, totalDuration, firstStreamTimestampMs, 
        latestRunLabel, lastStreamTimestampMs, lastStreamTimestampRaw, latestRunName, 
        thumbnail_urls: data.thumbnail_urls || []
      });
    });

    // Sort flat array chronologically once
    allFlat.sort((a, b) => a.startMs - b.startMs);
    
    return { games: processedGames, flatStreams: allFlat };
  }, [streamData]);


  // ─── 2. Basic Shared Calculations ────────
  const totalStreams = flatStreams.length;
  const totalGames = games.length;
  const totalDurationOverall = useMemo(() => flatStreams.reduce((acc, s) => acc + s.duration, 0), [flatStreams]);

  const hourlyStreamData = useMemo(() => {
    const hours = Array.from({length: 24}, (_, i) => ({ 
      hour: i, 
      displayHour: i === 0 ? '12AM' : i < 12 ? `${i}AM` : i === 12 ? '12PM' : `${i-12}PM`,
      count: 0 
    }));
    flatStreams.forEach(s => {
      hours[new Date(s.startMs).getHours()].count += 1;
    });
    return hours;
  }, [flatStreams]);

  const dowStreamData = useMemo(() => {
    const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mapDay = (d) => d === 0 ? 6 : d - 1; 
    const dow = Array.from({length: 7}, (_, i) => ({ dayIndex: i, displayDay: displayDays[i], count: 0 }));
    flatStreams.forEach(s => {
      dow[mapDay(new Date(s.startMs).getDay())].count += 1;
    });
    return dow;
  }, [flatStreams]);


  // ─── 3. Daily Splitting & EXACT Seconds Streak/Break Calculations ────────
  const { dailyStreamHours, streakBreakStats } = useMemo(() => {
    if (flatStreams.length === 0) return { dailyStreamHours: [], streakBreakStats: {} };

    const mergedStreams = [];
    flatStreams.forEach(s => {
      if (mergedStreams.length === 0) {
        mergedStreams.push({ startMs: s.startMs, endMs: s.endMs });
      } else {
        const last = mergedStreams[mergedStreams.length - 1];
        if (s.startMs <= last.endMs) {
          last.endMs = Math.max(last.endMs, s.endMs);
        } else {
          mergedStreams.push({ startMs: s.startMs, endMs: s.endMs });
        }
      }
    });

    let maxBreakSecs = 0, maxBreakStartMs = null, maxBreakEndMs = null, isActiveBreak = false;
    for (let i = 1; i < mergedStreams.length; i++) {
      const brkStart = mergedStreams[i-1].endMs;
      const brkEnd = mergedStreams[i].startMs;
      const brkSecs = (brkEnd - brkStart) / 1000;
      if (brkSecs > maxBreakSecs) {
        maxBreakSecs = brkSecs; maxBreakStartMs = brkStart; maxBreakEndMs = brkEnd; isActiveBreak = false;
      }
    }

    const nowMs = Date.now();
    const lastEndMs = mergedStreams[mergedStreams.length - 1].endMs;
    if (nowMs > lastEndMs) {
      const activeBreakSecs = (nowMs - lastEndMs) / 1000;
      if (activeBreakSecs > maxBreakSecs) {
        maxBreakSecs = activeBreakSecs; maxBreakStartMs = lastEndMs; maxBreakEndMs = nowMs; isActiveBreak = true;
      }
    }

    const dailyMap = new Map();
    const getMidnight = (ms) => new Date(ms).setHours(0,0,0,0);

    flatStreams.forEach(stream => {
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
    const continuousDailyStreamHours = [];
    const todayMs = new Date().setHours(0,0,0,0);

    if (sortedDays.length > 0) {
      let currentMs = sortedDays[0];
      const endDateMs = Math.max(sortedDays[sortedDays.length - 1], todayMs);

      while (currentMs <= endDateMs) {
        const rawSecs = dailyMap.get(currentMs) || 0;
        const d = new Date(currentMs);
        continuousDailyStreamHours.push({
          dateMs: currentMs,
          displayDate: `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`,
          rawSeconds: rawSecs,
          hours: parseFloat((rawSecs / 3600).toFixed(2))
        });
        currentMs += 86400000; // Increment +1 day
      }
    }

    const streaks = [];
    let currentStreakDaysList = [];
    for (let i = 0; i < sortedDays.length; i++) {
       const day = sortedDays[i];
       if (i === 0) currentStreakDaysList = [day];
       else {
          if (Math.round((day - sortedDays[i-1]) / 86400000) === 1) {
            currentStreakDaysList.push(day);
          } else {
            streaks.push([...currentStreakDaysList]); 
            currentStreakDaysList = [day];
          }
       }
    }
    if (currentStreakDaysList.length > 0) streaks.push(currentStreakDaysList);

    let maxStreakSecs = 0, maxStreakStartMs = null, maxStreakEndMs = null;
    streaks.forEach(streakDays => {
       const streamsInStreak = flatStreams.filter(s => streakDays.includes(getMidnight(s.startMs)));
       if (streamsInStreak.length > 0) {
           const st = streamsInStreak[0].startMs;
           const en = Math.max(...streamsInStreak.map(s => s.endMs));
           const secs = (en - st) / 1000;
           if (secs > maxStreakSecs) { maxStreakSecs = secs; maxStreakStartMs = st; maxStreakEndMs = en; }
       }
    });

    return {
      dailyStreamHours: continuousDailyStreamHours,
      streakBreakStats: { longestStreakSecs: maxStreakSecs, maxStreakStartMs, maxStreakEndMs, longestBreakSecs: maxBreakSecs, maxBreakStartMs, maxBreakEndMs, isActiveBreak }
    };
  }, [flatStreams]);


  // ─── 4. Chronological Streams & Extremes ────────
  const { allStreamsChronological, longestStream, shortestStream } = useMemo(() => {
    if (flatStreams.length === 0) return { allStreamsChronological: [], longestStream: null, shortestStream: null };
    
    const chrono = flatStreams.map((s, i) => ({ ...s, index: i + 1 }));
    let longest = chrono[0];
    let shortest = chrono[0];

    for (const s of chrono) {
      if (s.duration > longest.duration) longest = s;
      if (s.duration < shortest.duration) shortest = s;
    }

    return { allStreamsChronological: chrono, longestStream: longest, shortestStream: shortest };
  }, [flatStreams]);


  // ─── 5. Deficit & Session Stats ────────
  const deficitStats = useMemo(() => {
    let actualSessionSecs = 0, discardedSecs = 0, gainedSecs = 0;
    const deficitData = [];
    
    flatStreams.forEach((s, idx) => {
      actualSessionSecs += s.actualDur;
      if (s.diff > 0) discardedSecs += s.diff;
      if (s.diff < 0) gainedSecs += Math.abs(s.diff);
      
      deficitData.push({
        index: idx + 1,
        gameName: s.gameName,
        streamTitle: s.streamTitle,
        diff: s.diff,
        dateMs: s.startMs
      });
    });

    return { actualSessionSecs, discardedSecs, gainedSecs, deficitData };
  }, [flatStreams]);


  // ─── 6. General Game Data (Timelines & Status) ────────
  const statusData = useMemo(() => {
    const sums = { Completed: 0, Ongoing: 0, Abandoned: 0 };
    games.forEach(g => {
      sums[g.latestRunLabel || 'Ongoing'] += g.totalDuration / 3600;
    });
    return [
      { name: 'Ongoing',   hours: parseFloat((sums.Ongoing || 0).toFixed(1)), color: '#3ddc84' },
      { name: 'Completed', hours: parseFloat((sums.Completed || 0).toFixed(1)), color: '#f5a623' },
      { name: 'Abandoned', hours: parseFloat((sums.Abandoned || 0).toFixed(1)), color: '#ff5c5c' },
    ];
  }, [games]);

  const progressionDates = useMemo(() => {
    const s = new Set(flatStreams.map(fs => fs.startMs));
    return Array.from(s).sort((a,b) => a-b);
  }, [flatStreams]);

  const streamProgressionLines = useMemo(() => {
    const dateToIndex = new Map(progressionDates.map((d, i) => [d, i]));
    
    // Group streams internally for fast lookup
    const groupedStreams = {};
    flatStreams.forEach(fs => {
      if (!groupedStreams[fs.gameId]) groupedStreams[fs.gameId] = [];
      groupedStreams[fs.gameId].push(fs);
    });

    return games.filter(g => g.totalDuration > 0).map(g => {
      let cumSecs = 0; 
      const gStreams = groupedStreams[g.id] || [];
      
      const dataPoints = gStreams.map(fs => {
        cumSecs += fs.duration;
        return {
          xIndex: dateToIndex.get(fs.startMs),
          cumulativeHours: parseFloat((cumSecs / 3600).toFixed(2)),
          rawSeconds: cumSecs,
          date: fs.startMs,
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
  }, [games, flatStreams, progressionDates, layoutPrefs?.highResImages]);

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
    const excludedMetaTags = new Set([
      'steam achievements', 'family sharing', 'captions available', 'in-app purchases', 'stats', 'includes level editor', 'vr support', 'steam cloud', 'steam leaderboards', 'cross-platform multiplayer', 'mmo', 'partial controller support', 'hdr available', 'stereo sound', 'custom volume controls', 'surround sound', 'playable without timed input', 'camera comfort', 'save anytime', 'full controller support', 'controller', 'co-op', 'online co-op', 'multiplayer', 'singleplayer', 'qte', 'accessibility', 'remote play', 'cloud saves', 'achievements', 'trading cards', 'windows', 'mac', 'linux'
    ]);

    games.forEach(g => {
      if (g.details && g.details.tags) {
        g.details.tags.split(',').forEach(t => {
          const trimmed = t.trim();
          const lowerT = trimmed.toLowerCase();
          if (trimmed && lowerT !== 'unknown' && trimmed.split(' ').length <= 3 && /^[a-zA-Z\s\-]+$/.test(trimmed)) {
            if (!excludedMetaTags.has(lowerT) && !lowerT.includes('controller') && !lowerT.includes('steam ') && !lowerT.includes('sound')) {
              counts[trimmed] = (counts[trimmed] || 0) + 1;
            }
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


  // ─── 7. Heavy Chart Render Property Calculations ────────
  const { processedHourlyData, hourlyYTicks } = useMemo(() => {
    const maxHCount = Math.max(...hourlyStreamData.map(d => d.count), 0);
    const pData = hourlyStreamData.map(d => ({ ...d, midThreshold: maxHCount / 2 }));
    let ticks;
    if (maxHCount <= 3) {
      ticks = [1, 2, 3].filter(v => v <= maxHCount);
    } else {
      const midPoint = Math.round(maxHCount / 2);
      const roundedMid = Math.ceil(midPoint / 5) * 5;
      const roundedMax = Math.ceil(maxHCount / 10) * 10;
      if (roundedMid * 2 >= roundedMax && roundedMid > 0) ticks = [roundedMid, roundedMax];
      else { const step = Math.ceil(maxHCount / 3 / 5) * 5 || 5; ticks = [step, step * 2, step * 3]; }
    }
    return { processedHourlyData: pData, hourlyYTicks: ticks };
  }, [hourlyStreamData]);

  const { statusYMax, statusYTicks } = useMemo(() => {
    const maxH = Math.max(...statusData.map(d => d.hours), 0);
    if (maxH === 0) return { statusYMax: 50, statusYTicks: [25, 50] };
    let cMax = Math.ceil(maxH / 10) * 10;
    if (cMax % 2 !== 0) cMax += 10;
    return { statusYMax: cMax, statusYTicks: [cMax / 2, cMax] };
  }, [statusData]);

  const { processedDowData, dowDomainMax, dowValidTicks, dowTickMap } = useMemo(() => {
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const orderedDowData = [...dowStreamData].sort((a, b) => dayOrder.indexOf(a.displayDay) - dayOrder.indexOf(b.displayDay));
    const counts = orderedDowData.map(d => d.count);
    const nonZeroCounts = counts.filter(c => c > 0);
    const minC = nonZeroCounts.length > 0 ? Math.min(...nonZeroCounts) : 0;
    const maxC = Math.max(...counts, 0);
    const step = maxC > 80 ? 20 : 10;
    const roundedMin = Math.floor(minC / 10) * 10;
    
    if (roundedMin === 0 || maxC < 10 || maxC - roundedMin <= 5) {
      const tks = []; for (let i = step; i <= maxC + step; i += step) tks.push(i);
      return { processedDowData: orderedDowData.map(d => ({ ...d, fakeCount: d.count, realCount: d.count })), dowDomainMax: maxC === 0 ? 10 : maxC, dowValidTicks: tks, dowTickMap: {} };
    }
    const GAP = step; const tks = [GAP]; const map = { [GAP]: roundedMin };
    let cReal = roundedMin + step, cFake = GAP + step;
    while (cReal <= maxC + step) { tks.push(cFake); map[cFake] = cReal; cReal += step; cFake += step; }
    
    const pData = orderedDowData.map(d => {
      let fVal = 0;
      if (d.count >= roundedMin) fVal = GAP + (d.count - roundedMin);
      else if (d.count > 0) fVal = (d.count / roundedMin) * GAP;
      return { ...d, fakeCount: fVal, realCount: d.count };
    });
    const maxFake = Math.max(...pData.map(d => d.fakeCount));
    return { processedDowData: pData, dowDomainMax: maxFake === 0 ? 10 : maxFake, dowValidTicks: tks.filter(t => t <= maxFake), dowTickMap: map };
  }, [dowStreamData]);

  const { deficitYMax, deficitYMin } = useMemo(() => {
    if (deficitStats.deficitData.length === 0) return { deficitYMax: 60, deficitYMin: -60 };
    let max = deficitStats.deficitData[0], min = deficitStats.deficitData[0];
    deficitStats.deficitData.forEach(d => { if (d.diff > max.diff) max = d; if (d.diff < min.diff) min = d; });
    const absMax = Math.max(Math.abs(Math.ceil(max.diff / 60)), Math.abs(Math.floor(min.diff / 60)), 10);
    const yM = Math.ceil(absMax / 10) * 10;
    return { deficitYMax: yM * 60 * 1.15, deficitYMin: -yM * 60 * 1.15 };
  }, [deficitStats.deficitData]);

  const { timelineXTicks, timelineYMax, timelineYTicks } = useMemo(() => {
    const ticksX = []; let lastMo = '';
    gamesTimeline.forEach((g, i) => {
      const parts = g.month.split(' ');
      const fmd = parts.length === 2 ? `${parts[0]} '${parts[1].slice(-2)}` : g.month;
      if (fmd !== lastMo) { ticksX.push(i); lastMo = fmd; }
    });
    const maxH = Math.max(...gamesTimeline.map(g => g.hours), 0);
    let yM = 3, ticksY = [1, 2, 3];
    if (maxH > 0) {
      if (maxH <= 10) yM = Math.ceil(maxH);
      else if (maxH <= 100) yM = Math.ceil(maxH / 5) * 5;
      else yM = Math.ceil(maxH / 10) * 10;
      const step = Math.ceil(yM / 4);
      ticksY = []; for (let i = step; i <= yM; i += step) ticksY.push(i);
    }
    return { timelineXTicks: ticksX, timelineYMax: yM, timelineYTicks: ticksY };
  }, [gamesTimeline]);

  const { processedProgressionLines, progressionYMax, progressionYTicks } = useMemo(() => {
    const procLines = streamProgressionLines.map(line => {
      const dataMap = new Map(line.data.map(d => [d.xIndex, d]));
      const minX = Math.min(...line.data.map(d => d.xIndex));
      const maxX = Math.max(...line.data.map(d => d.xIndex));
      const contData = []; let lastH = 0, lastS = 0;
      for (let idx = minX; idx <= maxX; idx++) {
        if (dataMap.has(idx)) { const p = dataMap.get(idx); lastH = p.cumulativeHours; lastS = p.rawSeconds; contData.push({ ...p, lineColor: line.color }); } 
        else { contData.push({ xIndex: idx, cumulativeHours: lastH, rawSeconds: lastS, date: progressionDates[idx], gameName: line.gameName, lineColor: line.color }); }
      }
      return { ...line, data: contData, endDot: contData[contData.length - 1], minX, maxX };
    });
    let maxH = 0; procLines.forEach(l => { if (l.endDot && l.endDot.cumulativeHours > maxH) maxH = l.endDot.cumulativeHours; });
    let yM = 15, ticksY = [5, 10, 15];
    if (maxH > 0) { const step = Math.max(5, Math.ceil(maxH / 3 / 5) * 5); yM = step * 3; ticksY = [step, step * 2, step * 3]; }
    return { processedProgressionLines: procLines, progressionYMax: yM, progressionYTicks: ticksY };
  }, [streamProgressionLines, progressionDates]);

  const { processedDailyData, dailyYMax, dailyYTicks, maxDailyPoint } = useMemo(() => {
    const maxH = Math.max(...dailyStreamHours.map(d => d.hours), 0);
    const pData = dailyStreamHours.map(d => ({ ...d, midThreshold: maxH / 2 }));
    let yM = 3, ticksY = [1, 2, 3];
    if (maxH > 0) {
      yM = Math.ceil(maxH) + 3;
      const step = Math.max(1, Math.ceil(yM / 4));
      ticksY = []; for (let i = step; i < yM; i += step) ticksY.push(i);
    }
    const maxP = pData.length > 0 ? pData.reduce((p, c) => (p.rawSeconds > c.rawSeconds) ? p : c, pData[0]) : null;
    return { processedDailyData: pData, dailyYMax: yM, dailyYTicks: ticksY, maxDailyPoint: maxP };
  }, [dailyStreamHours]);

  const { chronoYMax, chronoYTicks, maxChronoPoint } = useMemo(() => {
    const maxH = Math.max(...allStreamsChronological.map(d => d.hours), 0);
    let yM = 3, ticksY = [1, 2, 3];
    if (maxH > 0) {
      yM = Math.ceil(maxH) + 2;
      const step = Math.max(1, Math.ceil(yM / 4));
      ticksY = []; for (let i = step; i < yM; i += step) ticksY.push(i);
    }
    const maxP = allStreamsChronological.length > 0 ? allStreamsChronological.reduce((p, c) => (p.duration > c.duration) ? p : c, allStreamsChronological[0]) : null;
    return { chronoYMax: yM, chronoYTicks: ticksY, maxChronoPoint: maxP };
  }, [allStreamsChronological]);

  // ─── 8. Compilation ────────
  const card1Data = { 
    totalStreams, totalDuration: totalDurationOverall, longestStreakSecs: streakBreakStats.longestStreakSecs,
    maxStreakStartMs: streakBreakStats.maxStreakStartMs, maxStreakEndMs: streakBreakStats.maxStreakEndMs,
    actualSessionSecs: deficitStats.actualSessionSecs, discardedSecs: deficitStats.discardedSecs, gainedSecs: deficitStats.gainedSecs,
    longestStream, highResImages: layoutPrefs?.highResImages,
    processedHourlyData, hourlyYTicks
  };
  
  const card2Data = { 
    totalGames, statusData, longestBreakSecs: streakBreakStats.longestBreakSecs, maxBreakStartMs: streakBreakStats.maxBreakStartMs,
    maxBreakEndMs: streakBreakStats.maxBreakEndMs, isActiveBreak: streakBreakStats.isActiveBreak, shortestStream,
    highResImages: layoutPrefs?.highResImages, deficitData: deficitStats.deficitData,
    statusYMax, statusYTicks, processedDowData, dowDomainMax, dowValidTicks, dowTickMap, deficitYMax, deficitYMin
  };
  
  const card3Data = { 
    mostRecentGame, timeSinceLastStream, gamesTimeline, progressionDates, allStreamsChronological, tagFrequencies,
    timelineXTicks, timelineYMax, timelineYTicks, processedProgressionLines, progressionYMax, progressionYTicks,
    processedDailyData, dailyYMax, dailyYTicks, maxDailyPoint, chronoYMax, chronoYTicks, maxChronoPoint
  };

  return { card1Data, card2Data, card3Data, games };
}