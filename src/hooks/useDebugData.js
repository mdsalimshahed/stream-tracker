// src/hooks/useDebugData.js
import { useMemo } from 'react';
import { getLatestRunWithTimestamp } from '../components/stats/utils';
import { getLowResUrl, getTsDateStr, parseCustomTimestamp } from '../utils/helpers';

export function useDebugData(streamData, layoutPrefs) {
  const highResImages = layoutPrefs?.highResImages;
  const excludedTagsStr = (layoutPrefs?.excludedTags || []).join(',');

  const stats = useMemo(() => {
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

    allFlat.sort((a, b) => a.startMs - b.startMs);
    
    const totalStreamsCount = allFlat.length;
    const totalGamesCount = processedGames.length;
    const totalDurationOverall = allFlat.reduce((acc, s) => acc + s.duration, 0);

    const hourlyStreamData = Array.from({length: 24}, (_, i) => ({ 
      hour: i, displayHour: i === 0 ? '12AM' : i < 12 ? `${i}AM` : i === 12 ? '12PM' : `${i-12}PM`, count: 0 
    }));
    allFlat.forEach(s => { hourlyStreamData[new Date(s.startMs).getHours()].count += 1; });

    const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mapDay = (d) => d === 0 ? 6 : d - 1; 
    const dowStreamData = Array.from({length: 7}, (_, i) => ({ dayIndex: i, displayDay: displayDays[i], count: 0 }));
    allFlat.forEach(s => { dowStreamData[mapDay(new Date(s.startMs).getDay())].count += 1; });

    const mergedStreams = [];
    allFlat.forEach(s => {
      if (mergedStreams.length === 0) mergedStreams.push({ startMs: s.startMs, endMs: s.endMs });
      else {
        const last = mergedStreams[mergedStreams.length - 1];
        if (s.startMs <= last.endMs) last.endMs = Math.max(last.endMs, s.endMs);
        else mergedStreams.push({ startMs: s.startMs, endMs: s.endMs });
      }
    });

    let maxBreakSecs = 0, maxBreakStartMs = null, maxBreakEndMs = null, isActiveBreak = false;
    for (let i = 1; i < mergedStreams.length; i++) {
      const brkStart = mergedStreams[i-1].endMs;
      const brkEnd = mergedStreams[i].startMs;
      const brkSecs = (brkEnd - brkStart) / 1000;
      if (brkSecs > maxBreakSecs) { maxBreakSecs = brkSecs; maxBreakStartMs = brkStart; maxBreakEndMs = brkEnd; isActiveBreak = false; }
    }

    if (mergedStreams.length > 0) {
      const nowMs = Date.now();
      const lastEndMs = mergedStreams[mergedStreams.length - 1].endMs;
      if (nowMs > lastEndMs) {
        const activeBreakSecs = (nowMs - lastEndMs) / 1000;
        if (activeBreakSecs > maxBreakSecs) { maxBreakSecs = activeBreakSecs; maxBreakStartMs = lastEndMs; maxBreakEndMs = nowMs; isActiveBreak = true; }
      }
    }

    const dailyMap = new Map();
    const getMidnight = (ms) => new Date(ms).setHours(0,0,0,0);

    allFlat.forEach(stream => {
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
          dateMs: currentMs, displayDate: `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`, rawSeconds: rawSecs, hours: parseFloat((rawSecs / 3600).toFixed(2))
        });
        currentMs += 86400000; 
      }
    }

    const streaks = [];
    let currentStreakDaysList = [];
    for (let i = 0; i < sortedDays.length; i++) {
       const day = sortedDays[i];
       if (i === 0) currentStreakDaysList = [day];
       else {
          if (Math.round((day - sortedDays[i-1]) / 86400000) === 1) currentStreakDaysList.push(day);
          else { streaks.push([...currentStreakDaysList]); currentStreakDaysList = [day]; }
       }
    }
    if (currentStreakDaysList.length > 0) streaks.push(currentStreakDaysList);

    let maxStreakSecs = 0, maxStreakStartMs = null, maxStreakEndMs = null;
    streaks.forEach(streakDays => {
       const streamsInStreak = allFlat.filter(s => streakDays.includes(getMidnight(s.startMs)));
       if (streamsInStreak.length > 0) {
           const st = streamsInStreak[0].startMs;
           const en = Math.max(...streamsInStreak.map(s => s.endMs));
           const secs = (en - st) / 1000;
           if (secs > maxStreakSecs) { maxStreakSecs = secs; maxStreakStartMs = st; maxStreakEndMs = en; }
       }
    });

    const chrono = allFlat.map((s, i) => ({ ...s, index: i + 1 }));
    let longestStream = chrono.length ? chrono[0] : null;
    let shortestStream = chrono.length ? chrono[0] : null;
    chrono.forEach(s => {
      if (s.duration > longestStream.duration) longestStream = s;
      if (s.duration < shortestStream.duration) shortestStream = s;
    });

    let actualSessionSecs = 0, discardedSecs = 0, gainedSecs = 0;
    const deficitData = [];
    allFlat.forEach((s, idx) => {
      actualSessionSecs += s.actualDur;
      if (s.diff > 0) discardedSecs += s.diff;
      if (s.diff < 0) gainedSecs += Math.abs(s.diff);
      deficitData.push({ index: idx + 1, gameName: s.gameName, streamTitle: s.streamTitle, diff: s.diff, dateMs: s.startMs });
    });

    const statusSums = { Completed: 0, Ongoing: 0, Abandoned: 0 };
    processedGames.forEach(g => { statusSums[g.latestRunLabel || 'Ongoing'] += g.totalDuration / 3600; });
    const statusData = [
      { name: 'Ongoing',   hours: parseFloat((statusSums.Ongoing || 0).toFixed(1)), color: '#3ddc84' },
      { name: 'Completed', hours: parseFloat((statusSums.Completed || 0).toFixed(1)), color: '#f5a623' },
      { name: 'Abandoned', hours: parseFloat((statusSums.Abandoned || 0).toFixed(1)), color: '#ff5c5c' },
    ];

    const progressionDates = Array.from(new Set(allFlat.map(fs => fs.startMs))).sort((a,b) => a-b);
    const dateToIndex = new Map(progressionDates.map((d, i) => [d, i]));
    
    const groupedStreams = {};
    allFlat.forEach(fs => {
      if (!groupedStreams[fs.gameId]) groupedStreams[fs.gameId] = [];
      groupedStreams[fs.gameId].push(fs);
    });

    const streamProgressionLines = processedGames.filter(g => g.totalDuration > 0).map(g => {
      let cumSecs = 0; 
      const dataPoints = (groupedStreams[g.id] || []).map(fs => {
        cumSecs += fs.duration;
        return { xIndex: dateToIndex.get(fs.startMs), cumulativeHours: parseFloat((cumSecs / 3600).toFixed(2)), rawSeconds: cumSecs, date: fs.startMs, gameName: g.game_name };
      });
      const color = g.latestRunLabel === 'Completed' ? '#f5a623' : g.latestRunLabel === 'Ongoing' ? '#3ddc84' : '#ff5c5c';
      return { gameName: g.game_name, color, status: g.latestRunLabel, image: getLowResUrl(g.thumbnail_urls?.[0] || '', highResImages), data: dataPoints };
    });

    const gamesTimeline = processedGames.filter(g => g.totalDuration > 0 && g.firstStreamTimestampMs)
      .sort((a, b) => a.firstStreamTimestampMs - b.firstStreamTimestampMs)
      .map((g, index) => {
        const d = new Date(g.firstStreamTimestampMs);
        return { index, name: g.game_name, hours: parseFloat((g.totalDuration / 3600).toFixed(1)), rawSeconds: g.totalDuration, fullDate: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), status: g.latestRunLabel, image: getLowResUrl(g.thumbnail_urls?.[0] || '', highResImages) };
      });

    let mostRecentGame = null;
    processedGames.forEach(g => {
      if (!mostRecentGame || (g.lastStreamTimestampMs && g.lastStreamTimestampMs > (mostRecentGame.lastStreamTimestampMs || 0))) mostRecentGame = g;
    });

    const counts = {};
    const userExcluded = excludedTagsStr ? excludedTagsStr.split(',') : [];
    const excludedMetaTags = new Set(['steam achievements', 'family sharing', 'captions available', 'in-app purchases', 'stats', 'includes level editor', 'vr support', 'steam cloud', 'steam leaderboards', 'cross-platform multiplayer', 'mmo', 'partial controller support', 'hdr available', 'stereo sound', 'custom volume controls', 'surround sound', 'playable without timed input', 'camera comfort', 'save anytime', 'full controller support', 'controller', 'co-op', 'online co-op', 'multiplayer', 'singleplayer', 'qte', 'accessibility', 'remote play', 'cloud saves', 'achievements', 'trading cards', 'windows', 'mac', 'linux', ...userExcluded.map(t=>t.toLowerCase())]);

    processedGames.forEach(g => {
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
    const tagFrequencies = Object.entries(counts).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count).slice(0, 100); 

    // --- GRAPH LIMIT MATH ROUNDING (Max 5 ticks, steps of 5/10/etc.) ---
    
    // Hourly
    const maxHCount = Math.max(...hourlyStreamData.map(d => d.count), 0);
    const processedHourlyData = hourlyStreamData.map(d => ({ ...d, midThreshold: maxHCount / 2 }));
    let hStep = Math.max(5, Math.ceil(maxHCount / 4 / 5) * 5);
    let hourlyYMax = Math.ceil(maxHCount / hStep) * hStep || 5;
    let hourlyYTicks = [];
    for(let i=hStep; i<=hourlyYMax; i+=hStep) hourlyYTicks.push(i);

    // Status
    const maxStatusH = Math.max(...statusData.map(d => d.hours), 0);
    let sStep = Math.max(5, Math.ceil(maxStatusH / 4 / 5) * 5);
    let statusYMax = Math.ceil(maxStatusH / sStep) * sStep || 5;
    let statusYTicks = [];
    for(let i=sStep; i<=statusYMax; i+=sStep) statusYTicks.push(i);

    // Day of Week (DOW) - Zero base + second tick matches minimum data exactly
    const orderedDowData = [...dowStreamData].sort((a, b) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(a.displayDay) - ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(b.displayDay));
    const dowCounts = orderedDowData.map(d => d.count);
    const nonZeroDow = dowCounts.filter(c => c > 0);
    const dowMaxC = Math.max(...dowCounts, 0);
    const dowMinC = nonZeroDow.length > 0 ? Math.min(...nonZeroDow) : 0;
    
    let processedDowData = [], dowDomainMax = 5, dowValidTicks = [], dowTickMap = {};
    if (dowMinC === 0 || dowMaxC === dowMinC) {
      let dowStep = Math.max(5, Math.ceil(dowMaxC / 4 / 5) * 5);
      let maxFake = Math.ceil(dowMaxC / dowStep) * dowStep || 5;
      dowValidTicks = [0];
      dowTickMap[0] = 0;
      for (let i = dowStep; i <= maxFake; i += dowStep) {
        dowValidTicks.push(i);
        dowTickMap[i] = i;
      }
      processedDowData = orderedDowData.map(d => ({ ...d, fakeCount: d.count, realCount: d.count }));
      dowDomainMax = maxFake;
    } else {
      const range = dowMaxC - dowMinC;
      let step = Math.max(5, Math.ceil(range / 3 / 5) * 5); 
      
      dowValidTicks = [0];
      dowTickMap[0] = 0;
      let cReal = dowMinC;
      let cFake = step;
      
      while (cReal <= dowMaxC + step) {
        dowValidTicks.push(cFake);
        dowTickMap[cFake] = cReal;
        cReal += step;
        cFake += step;
      }
      
      processedDowData = orderedDowData.map(d => {
        let fVal = 0;
        if (d.count >= dowMinC) {
          fVal = step + (d.count - dowMinC);
        } else if (d.count > 0) {
          fVal = (d.count / dowMinC) * step;
        }
        return { ...d, fakeCount: fVal, realCount: d.count };
      });
      
      const maxFake = Math.max(...processedDowData.map(d => d.fakeCount));
      dowDomainMax = Math.ceil(maxFake / step) * step || step;
      if (!dowValidTicks.includes(dowDomainMax) && dowDomainMax > 0) {
        dowValidTicks.push(dowDomainMax);
        dowTickMap[dowDomainMax] = dowMinC + (dowDomainMax - step);
      }
      dowValidTicks = dowValidTicks.filter(t => t <= dowDomainMax);
    }

    // Deficit Data limits
    let deficitYMax = 60 * 5, deficitYMin = -60 * 5;
    let deficitYTicks = [-300, 0, 300];
    if (deficitData.length > 0) {
      const maxDiffMins = Math.max(...deficitData.map(d => d.diff)) / 60;
      const minDiffMins = Math.min(...deficitData.map(d => d.diff)) / 60;
      
      const rangeMins = maxDiffMins - minDiffMins;
      let stepMins = Math.max(5, Math.ceil(rangeMins / 4 / 5) * 5);

      let topBoundMins = Math.ceil(maxDiffMins / stepMins) * stepMins;
      let bottomBoundMins = Math.floor(minDiffMins / stepMins) * stepMins;
      
      if (topBoundMins === 0 && maxDiffMins > 0) topBoundMins = stepMins;
      if (bottomBoundMins === 0 && minDiffMins < 0) bottomBoundMins = -stepMins;
      if (topBoundMins === bottomBoundMins) { topBoundMins += stepMins; bottomBoundMins -= stepMins; }

      deficitYMax = topBoundMins * 60;
      deficitYMin = bottomBoundMins * 60;
      
      deficitYTicks = [];
      for (let m = bottomBoundMins; m <= topBoundMins; m += stepMins) {
        deficitYTicks.push(m * 60);
      }
    }

    // Timeline
    const timelineXTicks = []; let lastMo = '';
    gamesTimeline.forEach((g, i) => {
      const parts = g.month.split(' ');
      const fmd = parts.length === 2 ? `${parts[0]} '${parts[1].slice(-2)}` : g.month;
      if (fmd !== lastMo) { timelineXTicks.push(i); lastMo = fmd; }
    });
    const maxTimeH = Math.max(...gamesTimeline.map(g => g.hours), 0);
    let tStep = Math.max(5, Math.ceil(maxTimeH / 4 / 5) * 5);
    let timelineYMax = Math.ceil(maxTimeH / tStep) * tStep || 5;
    let timelineYTicks = [];
    for(let i=tStep; i<=timelineYMax; i+=tStep) timelineYTicks.push(i);

    // Progression
    const processedProgressionLines = streamProgressionLines.map(line => {
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
    let maxProgH = 0; processedProgressionLines.forEach(l => { if (l.endDot && l.endDot.cumulativeHours > maxProgH) maxProgH = l.endDot.cumulativeHours; });
    let pStep = Math.max(5, Math.ceil(maxProgH / 4 / 5) * 5);
    let progressionYMax = Math.ceil(maxProgH / pStep) * pStep || 5;
    let progressionYTicks = [];
    for(let i=pStep; i<=progressionYMax; i+=pStep) progressionYTicks.push(i);

    // Daily
    const maxDailyH = Math.max(...continuousDailyStreamHours.map(d => d.hours), 0);
    const processedDailyData = continuousDailyStreamHours.map(d => ({ ...d, midThreshold: maxDailyH / 2 }));
    let dStep = Math.max(1, Math.ceil(maxDailyH / 5)); // Hourly Steps explicitly maintained here for daily distribution
    let dailyYMax = Math.ceil(maxDailyH / dStep) * dStep || 1;
    let dailyYTicks = [];
    for(let i=dStep; i<=dailyYMax; i+=dStep) dailyYTicks.push(i);
    const maxDailyPoint = processedDailyData.length > 0 ? processedDailyData.reduce((p, c) => (p.rawSeconds > c.rawSeconds) ? p : c, processedDailyData[0]) : null;

    // Chrono (Playtime per stream)
    const maxChronoH = Math.max(...chrono.map(d => d.hours), 0);
    let cStep = Math.max(1, Math.ceil(maxChronoH / 5)); // Hourly Steps explicitly maintained here for Playtime per Stream
    let chronoYMax = Math.ceil(maxChronoH / cStep) * cStep || 1;
    let chronoYTicks = [];
    for(let i=cStep; i<=chronoYMax; i+=cStep) chronoYTicks.push(i);
    const maxChronoPoint = chrono.length > 0 ? chrono.reduce((p, c) => (p.duration > c.duration) ? p : c, chrono[0]) : null;

    const card1Data = { 
      totalStreams: totalStreamsCount, totalDuration: totalDurationOverall, longestStreakSecs: maxStreakSecs,
      maxStreakStartMs, maxStreakEndMs, actualSessionSecs, discardedSecs, gainedSecs,
      longestStream, highResImages
    };
    
    const card2Data = { 
      totalGames: totalGamesCount, longestBreakSecs: maxBreakSecs, maxBreakStartMs,
      maxBreakEndMs, isActiveBreak, shortestStream, highResImages
    };
    
    const card3Data = { 
      mostRecentGame, gamesTimeline, progressionDates, allStreamsChronological: chrono, tagFrequencies,
      timelineXTicks, timelineYMax, timelineYTicks, processedProgressionLines, progressionYMax, progressionYTicks,
      processedDailyData, dailyYMax, dailyYTicks, maxDailyPoint, chronoYMax, chronoYTicks, maxChronoPoint,
      processedHourlyData, hourlyYTicks, hourlyYMax,
      statusData, statusYMax, statusYTicks, 
      processedDowData, dowDomainMax, dowValidTicks, dowTickMap, 
      deficitData, deficitYMax, deficitYMin, deficitYTicks
    };

    return { card1Data, card2Data, card3Data, games: processedGames };
  }, [streamData, highResImages, excludedTagsStr]);

  return { ...stats, isReady: true };
}