// src/components/Stats.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseCustomTimestamp, getLowResUrl, getTsDateStr } from '../utils/helpers';
import { CrossfadeImage } from './common/UIComponents';

const getLatestRunWithTimestamp = (cycles) => {
  let latestRun = null;
  let latestDate = null;
  let latestCycleId = null;
  Object.entries(cycles).forEach(([cycleId, run]) => {
    const timestamps = run.timestamps || [];
    if (timestamps.length > 0) {
      const lastTimestampStr = timestamps[timestamps.length - 1];
      const date = parseCustomTimestamp(lastTimestampStr);
      if (!latestDate || date > latestDate) {
        latestDate = date;
        latestRun = run;
        latestCycleId = cycleId;
      }
    } else if (!latestDate && run.stream_count > 0) {
      latestRun = run;
      latestCycleId = cycleId;
    }
  });
  return { run: latestRun, timestamp: latestRun?.timestamps?.length ? latestRun.timestamps[latestRun.timestamps.length - 1] : null, date: latestDate, cycleId: latestCycleId };
};

const useDynamicTime = (timestampMs) => {
  const [timeText, setTimeText] = useState('');
  useEffect(() => {
    if (!timestampMs) { setTimeText('Never'); return; }
    let interval;
    const update = () => {
      const now = Date.now();
      const diffSec = Math.floor((now - timestampMs) / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffSec < 60) setTimeText(`${diffSec} second${diffSec !== 1 ? 's' : ''} ago`);
      else if (diffMin < 60) setTimeText(`${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`);
      else if (diffHour < 24) setTimeText(`${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`);
      else setTimeText(`${diffDay} day${diffDay !== 1 ? 's' : ''} ago`);
    };
    
    update();
    
    const d = Math.floor((Date.now() - timestampMs) / 1000);
    if (d < 60) interval = setInterval(update, 1000);
    else if (d < 3600) interval = setInterval(update, 60000);
    else interval = setInterval(update, 3600000);
    
    return () => clearInterval(interval);
  }, [timestampMs]);
  return timeText;
};

const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === undefined || target === 0) { setCount(0); return; }
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

const STYLES = `
  .stats-root {
    --c-bg:      #080a0f;
    --c-surface: #0d1117;
    --c-border:  rgba(255,255,255,0.07);
    --c-accent:  #e8c87a;
    --c-accent2: #6eb5ff;
    --c-text:    #f0ece4;
    --c-muted:   rgba(240,236,228,0.7);
    --c-green:   #3ddc84;
    --c-orange:  #f5a623;
    --c-red:     #ff5c5c;
    color: var(--c-text);
  }
  .stats-root * { box-sizing: border-box; margin: 0; padding: 0; }
  
  .stats-scroll {
    position: relative; z-index: 10; height: 100%; width: 100%; 
    overflow-y: auto; display: flex; flex-direction: column; 
    padding: 24px; gap: 24px;
  }
  
  @media (min-width: 1024px) {
    .stats-scroll { overflow: hidden; }
  }

  .stats-top-row {
    display: flex; flex-direction: column; gap: 0; flex-shrink: 0; 
  }
  @media (min-width: 1024px) {
    .stats-top-row { 
      flex-direction: row; 
      flex: var(--flex-top) 1 0%; 
      min-height: 0; flex-shrink: 1; 
    }
  }

  .stats-left-col { 
    display: flex; flex-direction: row; gap: 0; flex: 1; z-index: 2;
  }
  @media (max-width: 640px) {
    .stats-left-col { flex-direction: column; }
  }
  @media (min-width: 1024px) {
    .stats-left-col { 
      flex-direction: column; 
      flex: 0 0 calc(var(--flex-left) * 1%); 
      width: calc(var(--flex-left) * 1%); 
      min-height: 0; gap: 0; 
    }
  }
  
  .stats-right-col { 
    flex: 1; background: rgba(13,17,23,0.35); position: relative; overflow: hidden; 
    border: 1px solid var(--c-border); border-radius: 0;
    min-height: 300px; z-index: 1;
  }
  @media (min-width: 1024px) {
    .stats-right-col { 
      flex: 0 0 calc(var(--flex-right) * 1%); 
      width: calc(var(--flex-right) * 1%); 
      min-height: 0; margin-left: -1px; 
    }
  }
  @media (max-width: 1023px) {
    .stats-right-col { margin-top: -1px; }
  }

  .stat-card {
    flex: 1; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 24px; 
    position: relative; overflow: hidden; transition: background 0.25s; 
    display: flex; flex-direction: column; justify-content: center; 
    border: 1px solid var(--c-border); border-radius: 0;
  }
  
  .stat-card:hover { background: rgba(20,26,36,0.8); }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(to right, var(--c-accent), transparent); opacity: 0; transition: opacity 0.25s;
  }
  .stat-card:hover::before { opacity: 1; }
  
  @media (min-width: 1024px) {
    .stat-card + .stat-card { margin-top: -1px; }
  }
  @media (max-width: 1023px) {
    .stat-card + .stat-card { margin-left: -1px; }
  }
  @media (max-width: 640px) {
    .stat-card + .stat-card { margin-left: 0; margin-top: -1px; }
  }

  .stat-number { font-weight: 600; line-height: 1; letter-spacing: -0.02em; color: var(--c-text); transition: color 0.3s ease; text-shadow: 0 4px 16px rgba(0,0,0,0.8); }
  .stat-card:hover .stat-number { color: var(--c-accent); }

  .stats-right-col:hover .latest-title { color: var(--c-accent) !important; }

  .top-number { font-size: calc(var(--sz-main) * 1rem); }
  .stat-label { font-size: calc(var(--sz-main-label) * 1rem); letter-spacing: 0.12em; text-transform: uppercase; color: var(--c-muted); margin-top: 12px; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
  
  .latest-title { font-size: calc(var(--sz-title) * 1rem); font-weight: 600; margin-bottom: 8px; transition: color 0.3s; line-height: 1.1; }
  .latest-sub-3 { font-size: calc(var(--sz-sub) * 1rem); color: var(--c-accent2); margin-top: 4px; line-height: 1.3; }
  .latest-sub-1, .latest-sub-2 { font-size: calc(var(--sz-sub) * 0.8rem); color: var(--c-muted); margin-top: 6px; }
  .latest-sub-time { font-weight: bold; color: var(--c-text); font-size: 1.25em; }

  .latest-bg { position: absolute; inset: 0; z-index: 0; }
  .latest-content { 
    position: absolute; inset: 0; z-index: 1; padding: 24px; 
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); 
    display: flex; flex-direction: column; justify-content: flex-end; 
  }

  .cat-row { display: flex; flex-direction: column; gap: 24px; flex-shrink: 0; }
  @media (min-width: 1024px) {
    .cat-row { flex-direction: row; flex: var(--flex-bottom) 1 0%; min-height: 0; flex-shrink: 1; }
  }
  
  .cat-card { flex: 1; position: relative; overflow: hidden; border: 1px solid var(--c-border); border-radius: 0; min-height: 200px; display: flex; flex-direction: column; cursor: default; transition: all 0.3s ease; z-index: 1; }
  @media (min-width: 1024px) {
    .cat-card { min-height: 0; }
  }
  .cat-card:hover { transform: scale(1.02); box-shadow: 0 16px 48px rgba(0,0,0,0.8); z-index: 10; }
  
  .cat-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%); }
  .cat-content { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; pointer-events: none;}
  
  .cat-count { font-weight: 600; line-height: 1; letter-spacing: -0.02em; color: #fff; text-shadow: 0 4px 16px rgba(0,0,0,0.8); font-size: calc(var(--sz-main) * 0.8rem); }
  .cat-name { letter-spacing: 0.2em; text-transform: uppercase; margin-top: 8px; text-shadow: 0 2px 8px rgba(0,0,0,0.8); font-size: calc(var(--sz-label) * 1rem); }
  
  .cat-ongoing .cat-name   { color: var(--c-green); }
  .cat-completed .cat-name { color: var(--c-orange); }
  .cat-abandoned .cat-name { color: var(--c-red); }
  
  .game-name-overlay { 
    position: absolute; top: 20px; left: 20px; right: 20px; z-index: 3; font-weight: 600; color: white; pointer-events: none; 
    text-shadow: 0 4px 12px rgba(0,0,0,1), 0 2px 6px rgba(0,0,0,0.8); transition: color 0.3s ease;
    font-size: calc(var(--sz-label) * 1.1rem); line-height: 1.2;
  }
  .cat-card:hover .game-name-overlay { color: var(--c-accent); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up  { animation: fadeUp 0.6s ease both; }
  .delay-1  { animation-delay: 0.1s; }
  .delay-2  { animation-delay: 0.2s; }
`;

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const generatePlaylist = (games, lastGameName = null) => {
  const validGames = games.filter(g => g.thumbnail_urls && g.thumbnail_urls.length > 0);
  if (validGames.length === 0) return [];

  let shuffledGames = shuffleArray(validGames);

  if (shuffledGames.length > 1 && lastGameName && shuffledGames[0].game_name === lastGameName) {
    const temp = shuffledGames[0];
    shuffledGames[0] = shuffledGames[1];
    shuffledGames[1] = temp;
  }

  let playlist = [];
  shuffledGames.forEach(game => {
    const uniqueThumbs = [...new Set((game.thumbnail_urls || []).filter(Boolean))];
    const shuffledImages = shuffleArray(uniqueThumbs);
    shuffledImages.forEach(url => {
      playlist.push({ url, gameName: game.game_name });
    });
  });

  return playlist;
};

const CategoryCard = ({ title, games, cssClass, highResImages }) => {
  const eligible = useMemo(() => games.filter(g => g.latestRunLabel === title), [games, title]);

  const playlistRef = useRef([]);
  const indexRef = useRef(0);
  const [currentData, setCurrentData] = useState({ url: null, gameName: '' });

  useEffect(() => {
    const newPlaylist = generatePlaylist(eligible, null);
    playlistRef.current = newPlaylist;
    indexRef.current = 0;
    setCurrentData(newPlaylist[0] || { url: null, gameName: '' });
  }, [eligible]);

  useEffect(() => {
    const totalValidImages = eligible.reduce((acc, g) => acc + new Set((g.thumbnail_urls || []).filter(Boolean)).size, 0);
    if (totalValidImages < 2) return;

    const initialDelay = Math.random() * 2500;
    const cycleInterval = 3000 + Math.random() * 1500;
    
    let interval;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        let idx = indexRef.current + 1;
        
        if (idx >= playlistRef.current.length) {
          const lastGame = playlistRef.current[playlistRef.current.length - 1]?.gameName;
          playlistRef.current = generatePlaylist(eligible, lastGame);
          idx = 0;
        }
        
        indexRef.current = idx;
        setCurrentData(playlistRef.current[idx]);
      }, cycleInterval);
    }, initialDelay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [eligible]);

  const fallback = 'https://placehold.co/480x270/0d1117/1e2938?text=';
  const currentSrc = currentData.url ? getLowResUrl(currentData.url, highResImages) : fallback;
  const gameName = currentData.gameName || '';

  return (
    <div className={`cat-card ${cssClass} group`}>
      <CrossfadeImage 
        src={currentSrc} 
        className="absolute inset-0 w-full h-full" 
        imgClassName="object-cover" 
        duration={700}
      />
      <div className="cat-overlay" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
      {gameName && <div className="game-name-overlay">{gameName}</div>}
      <div className="cat-content">
        <div className="cat-count">{eligible.length}</div>
        <div className="cat-name">{title}</div>
      </div>
    </div>
  );
};

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