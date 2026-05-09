// src/components/Stats.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseCustomTimestamp } from '../utils/helpers';
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
      if (diffSec < 60) setTimeText(`${diffSec}s ago`);
      else if (diffMin < 60) setTimeText(`${diffMin}m ago`);
      else if (diffHour < 24) setTimeText(`${diffHour}h ago`);
      else setTimeText(`${diffDay}d ago`);
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
  
  /* Lock layout strictly to viewport on desktop to prevent scrolling/overflow */
  @media (min-width: 1024px) {
    .stats-scroll { overflow: hidden; }
  }

  .mosaic-wrap { position: fixed; inset: 0; z-index: -10; overflow: hidden; pointer-events: none; }
  .mosaic-rows { display: flex; flex-direction: column; height: 100%; }
  .mosaic-row { flex: 1; display: flex; align-items: stretch; will-change: transform; }
  .mosaic-img { flex-shrink: 0; width: 110px; height: 100%; object-fit: cover; display: block; }
  .mosaic-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.70) 40%, rgba(0,0,0,0.95) 100%);
  }
  
  /* EXACT FLEXBOX PROPORTIONS FOR DESKTOP */
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
  
  /* Remove duplicate borders where cards touch */
  @media (min-width: 1024px) {
    .stat-card + .stat-card { margin-top: -1px; }
  }
  @media (max-width: 1023px) {
    .stat-card + .stat-card { margin-left: -1px; }
  }

  .stat-number { font-weight: 600; line-height: 1; letter-spacing: -0.02em; color: var(--c-text); transition: color 0.3s ease; text-shadow: 0 4px 16px rgba(0,0,0,0.8); }
  .stat-card:hover .stat-number { color: var(--c-accent); }

  .stats-right-col:hover .latest-title { color: var(--c-accent) !important; }

  /* DYNAMIC TEXT SCALING BOUNDS */
  .top-number { font-size: clamp(2rem, calc(var(--sz-main) * 1.5vmin), 6rem); }
  .stat-label { font-size: clamp(0.7rem, calc(var(--sz-main-label) * 0.9vmin), 2rem); letter-spacing: 0.12em; text-transform: uppercase; color: var(--c-muted); margin-top: 12px; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
  
  .latest-title { font-size: clamp(1.2rem, calc(var(--sz-title) * 1.5vmin), 4rem); font-weight: 600; margin-bottom: 8px; transition: color 0.3s; }
  .latest-sub-3 { font-size: clamp(0.85rem, calc(var(--sz-sub) * 1vmin), 2rem); color: var(--c-accent2); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .latest-sub-1, .latest-sub-2 { font-size: clamp(0.8rem, calc(var(--sz-sub) * 0.8vmin), 2rem); color: var(--c-muted); margin-top: 6px; }
  .latest-sub-time { font-weight: bold; color: var(--c-text); font-size: 1.06em; }

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
  
  .cat-count { font-weight: 600; line-height: 1; letter-spacing: -0.02em; color: #fff; text-shadow: 0 4px 16px rgba(0,0,0,0.8); font-size: clamp(2rem, calc(var(--sz-main) * 1.2vmin), 5rem); }
  .cat-name { letter-spacing: 0.2em; text-transform: uppercase; margin-top: 8px; text-shadow: 0 2px 8px rgba(0,0,0,0.8); font-size: clamp(0.7rem, calc(var(--sz-label) * 0.9vmin), 2rem); }
  
  .cat-ongoing .cat-name   { color: var(--c-green); }
  .cat-completed .cat-name { color: var(--c-orange); }
  .cat-abandoned .cat-name { color: var(--c-red); }
  
  .game-name-overlay { 
    position: absolute; top: 20px; left: 20px; z-index: 3; font-weight: 600; color: white; pointer-events: none; white-space: nowrap; 
    text-shadow: 0 4px 12px rgba(0,0,0,1), 0 2px 6px rgba(0,0,0,0.8); transition: color 0.3s ease;
    font-size: clamp(0.9rem, calc(var(--sz-label) * 1.1vmin), 2.5rem);
  }
  .cat-card:hover .game-name-overlay { color: var(--c-accent); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up  { animation: fadeUp 0.6s ease both; }
  .delay-1  { animation-delay: 0.1s; }
  .delay-2  { animation-delay: 0.2s; }

  @media (min-width: 1024px) {
    .top-number { font-size: calc(var(--sz-main) * 1vw); }
    .stat-label { font-size: calc(var(--sz-main-label) * 1vw); margin-top: 0.5vw; }
    .latest-title { font-size: calc(var(--sz-title) * 1vw); margin-bottom: 0.5vw; }
    .latest-sub-3 { font-size: calc(var(--sz-sub) * 1vw); margin-top: 0.5vw; }
    .latest-sub-1, .latest-sub-2 { font-size: calc(var(--sz-sub) * 0.8vw); margin-top: 0.5vw; }
    .latest-sub-time { font-size: 1.06em; }
    .cat-count { font-size: calc(var(--sz-main) * 1vw); }
    .cat-name { font-size: calc(var(--sz-label) * 1vw); margin-top: 0.3vw; }
    .game-name-overlay { font-size: calc(var(--sz-label) * 1.1vw); top: 1vw; left: 1vw; }
  }
`;

const ROW_COUNT = 6;
const IMG_W = 110;
const IMGS_PER_ROW = 16;

const MosaicBackground = ({ allImages, bgDimming }) => {
  const rowRefs = useRef([]);

  const rows = useMemo(() => {
    const fallback = 'https://placehold.co/110x110/0d1117/1e2938?text=';
    const pool = allImages.length ? allImages : [fallback];
    return Array.from({ length: ROW_COUNT }, () => {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const base = Array.from({ length: IMGS_PER_ROW }, (_, i) => shuffled[i % shuffled.length]);
      return [...base, ...base];
    });
  }, [allImages]);

  useEffect(() => {
    const STRIP_W = IMGS_PER_ROW * IMG_W;
    const state = Array.from({ length: ROW_COUNT }, (_, i) => {
      const base = 0.18 + Math.random() * 0.14;
      return {
        dir: i % 2 === 0 ? -1 : 1,
        pos: i % 2 === 0 ? 0 : -STRIP_W,
        speed: base,
        targetSpeed: base,
        baseSpeed: base,
        pauseTimer: Math.floor(Math.random() * 300),
        pauseCountdown: 0,
      };
    });

    let rafId;
    const tick = () => {
      state.forEach((s, i) => {
        const el = rowRefs.current[i];
        if (!el) return;

        s.pauseTimer--;
        if (s.pauseTimer <= 0) {
          if (Math.random() < 0.35) {
            s.pauseCountdown = 80 + Math.floor(Math.random() * 120);
            s.targetSpeed = 0.01 + Math.random() * 0.03;
          } else {
            s.targetSpeed = 0.14 + Math.random() * 0.18;
          }
          s.pauseTimer = 200 + Math.floor(Math.random() * 400);
        }
        if (s.pauseCountdown > 0) {
          s.pauseCountdown--;
          if (s.pauseCountdown === 0) s.targetSpeed = s.baseSpeed;
        }

        s.speed += (s.targetSpeed - s.speed) * 0.025;
        s.pos += s.dir * s.speed;

        if (s.dir === -1 && s.pos <= -STRIP_W) s.pos += STRIP_W;
        if (s.dir ===  1 && s.pos >=  0)       s.pos -= STRIP_W;

        el.style.transform = `translateX(${s.pos}px)`;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="mosaic-wrap">
      <div className="mosaic-rows">
        {rows.map((imgs, ri) => (
          <div key={ri} className="mosaic-row" ref={el => { rowRefs.current[ri] = el; }}>
            {imgs.map((src, ii) => (
              <img key={ii} className="mosaic-img" src={src} alt="" loading="lazy" />
            ))}
          </div>
        ))}
      </div>
      {/* App Background Dimming Slider Overlay ONLY */}
      <div className="absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none" style={{ opacity: bgDimming ?? 0.5 }} />
    </div>
  );
};

const CategoryCard = ({ title, games, cssClass }) => {
  const eligible = useMemo(() => games.filter(g => g.latestRunLabel === title), [games, title]);

  const imageEntries = useMemo(() => {
    const map = new Map();
    eligible.forEach(game => {
      (game.thumbnail_urls || []).forEach(url => {
        if (!map.has(url)) map.set(url, game.game_name);
      });
    });
    return Array.from(map.entries()).map(([url, gameName]) => ({ 
      url: url,
      gameName 
    }));
  }, [eligible]);

  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (imageEntries.length < 2) return;
    
    const initialDelay = Math.random() * 2500;
    const cycleInterval = 3000 + Math.random() * 1500;
    
    let interval;
    const timeout = setTimeout(() => {
      setCurrentIdx(prev => (prev + 1) % imageEntries.length);
      interval = setInterval(() => {
        setCurrentIdx(prev => (prev + 1) % imageEntries.length);
      }, cycleInterval);
    }, initialDelay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [imageEntries]);

  const fallback = 'https://placehold.co/480x270/0d1117/1e2938?text=';
  const currentSrc = imageEntries[currentIdx]?.url || fallback;
  const gameName = imageEntries[currentIdx]?.gameName || '';

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
      const totalStreams = Object.values(cycles).reduce((acc, c) => acc + (c.stream_count || 0), 0);
      const latestRunInfo = getLatestRunWithTimestamp(cycles);
      const latestRunLabel = latestRunInfo.run ? (latestRunInfo.run.label || 'Ongoing') : 'Ongoing';
      const lastStreamTimestampMs = latestRunInfo.date ? latestRunInfo.date.getTime() : null;
      const lastStreamTimestampRaw = latestRunInfo.timestamp;
      
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

  const allImages = useMemo(() => games.flatMap(g => g.thumbnail_urls || []).filter(Boolean), [games]);
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

  const heroThumb = allImages[0] || '';
  const latestBgImage = latestGameImages[latestBgIndex] || heroThumb;

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
      <MosaicBackground allImages={allImages} bgDimming={layoutPrefs?.bgDimming} />

      <div className="stats-scroll">
        <div className="stats-top-row fade-up delay-1 shadow-2xl">
          <div className="stats-left-col">
            <div className="stat-card">
              <div className="stat-number top-number">
                {totalStreamsCount.toLocaleString()}
              </div>
              <div className="stat-label">Streams</div>
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
          <CategoryCard title="Ongoing" games={games} cssClass="cat-ongoing" />
          <CategoryCard title="Completed" games={games} cssClass="cat-completed" />
          <CategoryCard title="Abandoned" games={games} cssClass="cat-abandoned" />
        </div>
      </div>
    </div>
  );
}