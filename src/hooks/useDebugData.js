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

    const getMidnight = (ms) => new Date(ms).setHours(0,0,0,0);
    const dailyMap = new Map();
    const dailyActiveStreams = new Map();

    // ───────────────────────────────────────────────────────────────
    // CALCULATE DAILY DURATIONS (Splitting exact video duration across midnight)
    // ───────────────────────────────────────────────────────────────
    allFlat.forEach((stream, idx) => {
      let currentStart = stream.startMs;
      let remainingSeconds = stream.duration; // Strictly using video duration
      let loopLimit = 48; 
      
      while (remainingSeconds > 0 && loopLimit > 0) {
        const currentMidnight = getMidnight(currentStart);
        const nextMidnight = currentMidnight + 86400000;
        const timeUntilNextMidnight = (nextMidnight - currentStart) / 1000;
        const secondsInCurrentDay = Math.min(remainingSeconds, timeUntilNextMidnight);
        
        dailyMap.set(currentMidnight, (dailyMap.get(currentMidnight) || 0) + secondsInCurrentDay);
        
        if (!dailyActiveStreams.has(currentMidnight)) {
            dailyActiveStreams.set(currentMidnight, new Set());
        }
        // Count how many unique streams touched this specific day
        dailyActiveStreams.get(currentMidnight).add(idx);
        
        remainingSeconds -= secondsInCurrentDay;
        currentStart = nextMidnight;
        loopLimit--;
      }
    });

    const sortedDays = Array.from(dailyMap.keys()).sort((a, b) => a - b);
    const continuousDailyStreamHours = [];
    const todayMs = new Date().setHours(0,0,0,0);

    let maxDailySecs = 0;
    let maxDailyDateMs = null;
    let zeroStreamDays = 0;

    if (sortedDays.length > 0) {
      let currentMs = sortedDays[0];
      const endDateMs = Math.max(sortedDays[sortedDays.length - 1], todayMs);
      
      const totalDaysSpan = Math.round((endDateMs - sortedDays[0]) / 86400000) + 1;
      zeroStreamDays = totalDaysSpan - sortedDays.length;

      while (currentMs <= endDateMs) {
        const rawSecs = dailyMap.get(currentMs) || 0;
        
        if (rawSecs > maxDailySecs) {
          maxDailySecs = rawSecs;
          maxDailyDateMs = currentMs;
        }

        const d = new Date(currentMs);
        continuousDailyStreamHours.push({
          dateMs: currentMs, 
          displayDate: `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`, 
          rawSeconds: rawSecs, 
          hours: parseFloat((rawSecs / 3600).toFixed(2))
        });
        currentMs += 86400000; 
      }
    }

    // ───────────────────────────────────────────────────────────────
    // SYNCHRONIZED BUSIEST DAY
    // ───────────────────────────────────────────────────────────────
    let busiestDayObj = { dateMs: null, secs: 0, count: 0 };
    dailyMap.forEach((secs, dateMs) => {
      if (secs > busiestDayObj.secs) {
        busiestDayObj = {
          dateMs,
          secs,
          count: dailyActiveStreams.get(dateMs)?.size || 0
        };
      }
    });

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

    const zeroHours = [];
    hourlyStreamData.forEach((d, i) => { if (d.count === 0) zeroHours.push(i); });
    
    let quietPrimary = "None";
    let quietSecondary = "";
    
    const formatHrClean = (h) => {
       const hr = h % 24;
       return hr === 0 ? '12 AM' : hr < 12 ? `${hr} AM` : hr === 12 ? '12 PM' : `${hr-12} PM`;
    };

    if (zeroHours.length === 24) {
      quietPrimary = "All Day";
    } else if (zeroHours.length > 0) {
      let longestSeq = [];
      let currentSeq = [];
      const doubled = [...zeroHours, ...zeroHours.map(h => h + 24)];
      
      for (let i = 0; i < doubled.length; i++) {
        if (i === 0 || doubled[i] === doubled[i-1] + 1) {
          currentSeq.push(doubled[i]);
        } else {
          if (currentSeq.length > longestSeq.length) longestSeq = [...currentSeq];
          currentSeq = [doubled[i]];
        }
      }
      if (currentSeq.length > longestSeq.length) longestSeq = [...currentSeq];
      
      const actualSeq = longestSeq.map(h => h % 24);
      const uniqueSeq = [...new Set(actualSeq)];
      
      if (uniqueSeq.length > 1) {
        const startRaw = longestSeq[0];
        const endRaw = longestSeq[longestSeq.length - 1];
        quietPrimary = `${formatHrClean(startRaw)} – ${formatHrClean(endRaw + 1)}`;
      } else {
        quietPrimary = `${formatHrClean(uniqueSeq[0])} – ${formatHrClean(uniqueSeq[0] + 1)}`;
      }
      
      const otherZeroes = zeroHours.filter(h => !uniqueSeq.includes(h));
      if (otherZeroes.length > 0) {
        quietSecondary = `${otherZeroes.map(formatHrClean).join(', ')} also had 0 streams`;
      }
    }

    const peakHourObj = hourlyStreamData.reduce((prev, current) => (prev.count > current.count) ? prev : current, {count: -1});
    const peakHourStr = peakHourObj.count > 0 ? `${formatHrClean(peakHourObj.hour)} – ${formatHrClean(peakHourObj.hour + 1)}` : 'None';
    const peakHourCount = peakHourObj.count;

    const chrono = allFlat.map((s, i) => ({ ...s, index: i + 1 }));
    let longestStream = chrono.length ? chrono[0] : null;
    let shortestStream = chrono.length ? chrono[0] : null;
    chrono.forEach(s => {
      if (s.duration > longestStream.duration) longestStream = s;
      if (s.duration < shortestStream.duration) shortestStream = s;
    });

    // ───────────────────────────────────────────────────────────────
    // CLOSEST TO RELEASE DATE & LONGEST ABANDONED
    // ───────────────────────────────────────────────────────────────
    let closestReleaseGame = null;
    let minReleaseDiff = Infinity;
    let dayZeroGamesSet = new Set();

    processedGames.forEach(g => {
      if (g.firstStreamTimestampMs) {
        let releaseMs;
        if (g.details?.releaseDate && g.details.releaseDate !== 'Unknown') {
          releaseMs = new Date(g.details.releaseDate).getTime();
          if (isNaN(releaseMs)) releaseMs = new Date(`${g.release_year}-01-01`).getTime();
        } else if (g.release_year) {
          releaseMs = new Date(`${g.release_year}-01-01`).getTime();
        }

        if (!isNaN(releaseMs)) {
          const diff = Math.abs(g.firstStreamTimestampMs - releaseMs);
          if (diff < minReleaseDiff) {
            minReleaseDiff = diff;
            closestReleaseGame = {
              gameName: g.game_name,
              diffMs: diff,
              thumbnails: g.thumbnail_urls || []
            };
          }
          if (diff < 86400000) { // Streamed within 24hrs of release
            dayZeroGamesSet.add(g.game_name);
          }
        }
      }
    });
    const dayZeroGames = Array.from(dayZeroGamesSet);

    let longestAbandonedGame = null;
    processedGames.forEach(g => {
      if (g.latestRunLabel === 'Abandoned') {
        if (!longestAbandonedGame || g.totalDuration > longestAbandonedGame.duration) {
          longestAbandonedGame = {
            gameName: g.game_name,
            duration: g.totalDuration,
            thumbnails: g.thumbnail_urls || []
          };
        }
      }
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

    // Graphical Limits
    const maxHCount = Math.max(...hourlyStreamData.map(d => d.count), 0);
    const processedHourlyData = hourlyStreamData.map(d => ({ ...d, midThreshold: maxHCount / 2 }));
    let hStep = 1;
    if (maxHCount > 20) hStep = Math.ceil(maxHCount / 4 / 5) * 5;
    else if (maxHCount > 10) hStep = 5;
    else if (maxHCount > 4) hStep = 2;
    let hourlyYMax = Math.max(1, Math.ceil(maxHCount / hStep) * hStep);
    let hourlyYTicks = [];
    for(let i = hStep; i <= hourlyYMax; i += hStep) hourlyYTicks.push(i);

    const maxStatusH = Math.max(...statusData.map(d => d.hours), 0);
    let sStep = 1;
    if (maxStatusH > 20) sStep = Math.ceil(maxStatusH / 4 / 5) * 5;
    else if (maxStatusH > 10) sStep = 5;
    else if (maxStatusH > 4) sStep = 2;
    let statusYMax = Math.max(1, Math.ceil(maxStatusH / sStep) * sStep);
    let statusYTicks = [];
    for(let i = sStep; i <= statusYMax; i += sStep) statusYTicks.push(i);

    const orderedDowData = [...dowStreamData].sort((a, b) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(a.displayDay) - ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(b.displayDay));
    const dowCounts = orderedDowData.map(d => d.count);
    const nonZeroDow = dowCounts.filter(c => c > 0);
    const dowMaxC = Math.max(...dowCounts, 0);
    const dowMinC = nonZeroDow.length > 0 ? Math.min(...nonZeroDow) : 0;
    
    let processedDowData = [], dowDomainMax = 1, dowValidTicks = [], dowTickMap = {};
    let dStepDow = 1;
    if (dowMaxC > 20) dStepDow = Math.ceil(dowMaxC / 4 / 5) * 5;
    else if (dowMaxC > 10) dStepDow = 5;
    else if (dowMaxC > 4) dStepDow = 2;

    if (dowMinC === 0 || dowMaxC === dowMinC) {
      let maxFake = Math.max(1, Math.ceil(dowMaxC / dStepDow) * dStepDow);
      dowValidTicks = [0];
      dowTickMap[0] = 0;
      for (let i = dStepDow; i <= maxFake; i += dStepDow) {
        dowValidTicks.push(i);
        dowTickMap[i] = i;
      }
      processedDowData = orderedDowData.map(d => ({ ...d, fakeCount: d.count, realCount: d.count }));
      dowDomainMax = maxFake;
    } else {
      const range = dowMaxC - dowMinC;
      let step = 1;
      if (range > 20) step = Math.ceil(range / 3 / 5) * 5;
      else if (range > 10) step = 5;
      else if (range > 4) step = 2;
      
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
      
      const maxFake = Math.max(...processedDowData.map(d => d.fakeCount), 1);
      dowDomainMax = Math.ceil(maxFake / step) * step || step;
      if (!dowValidTicks.includes(dowDomainMax) && dowDomainMax > 0) {
        dowValidTicks.push(dowDomainMax);
        dowTickMap[dowDomainMax] = dowMinC + (dowDomainMax - step);
      }
      dowValidTicks = dowValidTicks.filter(t => t <= dowDomainMax);
    }

    let deficitYMax = 60 * 5, deficitYMin = -60 * 5;
    let deficitYTicks = [-300, 0, 300];
    if (deficitData.length > 0) {
      const maxDiffMins = Math.max(...deficitData.map(d => d.diff)) / 60;
      const minDiffMins = Math.min(...deficitData.map(d => d.diff)) / 60;
      
      const rangeMins = Math.max(10, maxDiffMins - minDiffMins);
      let stepMins = 10;
      
      if (rangeMins > 600) stepMins = Math.ceil(rangeMins / 4 / 60) * 60; 
      else if (rangeMins > 200) stepMins = Math.ceil(rangeMins / 4 / 30) * 30; 
      else if (rangeMins > 60) stepMins = Math.ceil(rangeMins / 4 / 15) * 15; 
      else if (rangeMins > 20) stepMins = Math.ceil(rangeMins / 4 / 10) * 10; 
      else stepMins = 5;

      let topBoundMins = Math.ceil(maxDiffMins / stepMins) * stepMins;
      let bottomBoundMins = Math.floor(minDiffMins / stepMins) * stepMins;

      if (topBoundMins < 0) topBoundMins = 0;
      if (bottomBoundMins > 0) bottomBoundMins = 0;

      if (topBoundMins === bottomBoundMins) {
        topBoundMins += stepMins;
        bottomBoundMins -= stepMins;
      }

      deficitYMax = topBoundMins * 60;
      deficitYMin = bottomBoundMins * 60;
      
      deficitYTicks = [];
      for (let m = bottomBoundMins; m <= topBoundMins; m += stepMins) {
        deficitYTicks.push(m * 60);
      }
    }

    const timelineXTicks = []; let lastMo = '';
    gamesTimeline.forEach((g, i) => {
      const parts = g.month.split(' ');
      const fmd = parts.length === 2 ? `${parts[0]} '${parts[1].slice(-2)}` : g.month;
      if (fmd !== lastMo) { timelineXTicks.push(i); lastMo = fmd; }
    });
    const maxTimeH = Math.max(...gamesTimeline.map(g => g.hours), 0);
    let tStep = 1;
    if (maxTimeH > 20) tStep = Math.ceil(maxTimeH / 4 / 5) * 5;
    else if (maxTimeH > 10) tStep = 5;
    else if (maxTimeH > 4) tStep = 2;
    let timelineYMax = Math.max(1, Math.ceil(maxTimeH / tStep) * tStep);
    let timelineYTicks = [];
    for(let i = tStep; i <= timelineYMax; i += tStep) timelineYTicks.push(i);

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
    let pStep = 1;
    if (maxProgH > 20) pStep = Math.ceil(maxProgH / 4 / 5) * 5;
    else if (maxProgH > 10) pStep = 5;
    else if (maxProgH > 4) pStep = 2;
    let progressionYMax = Math.max(1, Math.ceil(maxProgH / pStep) * pStep);
    let progressionYTicks = [];
    for(let i = pStep; i <= progressionYMax; i += pStep) progressionYTicks.push(i);

    const maxDailyH = Math.max(...continuousDailyStreamHours.map(d => d.hours), 0);
    const processedDailyData = continuousDailyStreamHours.map(d => ({ ...d, midThreshold: maxDailyH / 2 }));
    let dStep = 1;
    if (maxDailyH > 20) dStep = Math.ceil(maxDailyH / 4 / 5) * 5;
    else if (maxDailyH > 10) dStep = 5;
    else if (maxDailyH > 4) dStep = 2;
    let dailyYMax = Math.max(1, Math.ceil(maxDailyH / dStep) * dStep);
    let dailyYTicks = [];
    for(let i = dStep; i <= dailyYMax; i += dStep) dailyYTicks.push(i);
    const maxDailyPoint = processedDailyData.length > 0 ? processedDailyData.reduce((p, c) => (p.rawSeconds > c.rawSeconds) ? p : c, processedDailyData[0]) : null;

    const maxChronoH = Math.max(...chrono.map(d => d.hours), 0);
    let cStep = 1;
    if (maxChronoH > 20) cStep = Math.ceil(maxChronoH / 4 / 5) * 5;
    else if (maxChronoH > 10) cStep = 5;
    else if (maxChronoH > 4) cStep = 2;
    let chronoYMax = Math.max(1, Math.ceil(maxChronoH / cStep) * cStep);
    let chronoYTicks = [];
    for(let i = cStep; i <= chronoYMax; i += cStep) chronoYTicks.push(i);
    const maxChronoPoint = chrono.length > 0 ? chrono.reduce((p, c) => (p.duration > c.duration) ? p : c, chrono[0]) : null;

    // Export payload data
    const card1Data = { 
      totalStreams: totalStreamsCount, 
      totalDuration: totalDurationOverall, 
      longestStream, 
      longestStreakSecs: maxStreakSecs,
      maxStreakStartMs, 
      maxStreakEndMs, 
      quietPrimary, 
      quietSecondary,
      closestReleaseGame,
      dayZeroGames,
      highResImages
    };
    
    const card2Data = { 
      totalGames: totalGamesCount, 
      actualSessionSecs, 
      discardedSecs, 
      gainedSecs,
      shortestStream, 
      longestBreakSecs: maxBreakSecs, 
      maxBreakStartMs,
      maxBreakEndMs, 
      isActiveBreak, 
      busiestDayObj, 
      longestAbandonedGame,
      highResImages
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