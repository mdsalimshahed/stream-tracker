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
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--c-text);
  }
  .stats-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .stats-scroll::-webkit-scrollbar { width: 4px; }
  .stats-scroll::-webkit-scrollbar-track { background: transparent; }
  .stats-scroll::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }

  .mosaic-wrap { position: fixed; inset: 0; z-index: -10; overflow: hidden; pointer-events: none; }
  .mosaic-rows { display: flex; flex-direction: column; height: 100%; }
  .mosaic-row { flex: 1; display: flex; align-items: stretch; will-change: transform; }
  .mosaic-img { flex-shrink: 0; width: 110px; height: 100%; object-fit: cover; display: block; }
  .mosaic-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.70) 40%, rgba(0,0,0,0.95) 100%);
  }

  .divider { height: 1px; background: linear-gradient(to right, var(--c-accent), transparent); margin: 0 12px 18px 12px; opacity: 0.5; }
  @media (min-width: 768px) { .divider { margin: 0 24px 18px 24px; } }
  
  .stats-top-row {
    display: flex; flex-direction: column; gap: 1px; margin: 0 12px;
    background: var(--c-border); border: 1px solid var(--c-border); border-radius: 2px; overflow: hidden;
  }
  @media (min-width: 768px) { .stats-top-row { flex-direction: row; margin: 0 24px; } }

  .stats-left-col { flex: 1; display: flex; flex-direction: row; flex-wrap: wrap; background: var(--c-border); gap: 1px; }
  
  /* Given a solid min-height on mobile to anchor the image and text properly */
  .stats-right-col { flex: 1; background: rgba(13,17,23,0.35); position: relative; overflow: hidden; min-height: 250px; }

  .stat-card {
    flex: 1 1 40%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 18px 16px; position: relative; overflow: hidden; transition: background 0.25s;
  }
  .stat-card:hover { background: rgba(20,26,36,0.8); }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(to right, var(--c-accent), transparent); opacity: 0; transition: opacity 0.25s;
  }
  .stat-card:hover::before { opacity: 1; }
  
  .stat-number { font-weight: 600; line-height: 1; letter-spacing: -0.02em; color: var(--c-text); transition: color 0.2s; text-shadow: 0 4px 16px rgba(0,0,0,0.8); }
  .stat-card:hover .stat-number { color: var(--c-accent); }
  .stat-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--c-muted); margin-top: 6px; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
  .stat-sub { font-size: 11px; color: var(--c-accent2); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }

  .latest-bg { position: absolute; inset: 0; z-index: 0; }
  
  /* STRICTLY anchored to bottom left with NO BLUR */
  .latest-content { 
    position: absolute; inset: 0; z-index: 1; padding: 24px; 
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); 
    display: flex; flex-direction: column; justify-content: flex-end; 
  }

  .cat-row { display: grid; grid-template-columns: 1fr; gap: 12px; margin: 18px 12px; }
  @media (min-width: 640px) { .cat-row { grid-template-columns: repeat(3, 1fr); margin: 18px 24px; } }
  
  .cat-card { position: relative; overflow: hidden; border: 1px solid var(--c-border); border-radius: 2px; aspect-ratio: 16/9; cursor: default; transition: transform 0.3s ease, box-shadow 0.3s ease; }
  .cat-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.8); }
  .cat-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%); }
  .cat-content { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; justify-content: flex-end; padding: 12px 14px; }
  .cat-count { font-weight: 600; font-size: 44px; line-height: 1; letter-spacing: -0.02em; color: #fff; text-shadow: 0 4px 16px rgba(0,0,0,0.8); }
  .cat-name { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 2px; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
  
  .cat-ongoing .cat-name   { color: var(--c-green); }
  .cat-completed .cat-name { color: var(--c-orange); }
  .cat-abandoned .cat-name { color: var(--c-red); }
  
  .game-name-overlay { position: absolute; top: 12px; left: 12px; z-index: 3; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; color: white; pointer-events: none; white-space: nowrap; border: 1px solid rgba(255,255,255,0.1); }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up  { animation: fadeUp 0.6s ease both; }
  .delay-1  { animation-delay: 0.1s; }
  .delay-2  { animation-delay: 0.2s; }
`;

const ROW_COUNT = 6;
const IMG_W = 110;
const IMGS_PER_ROW = 16;

const MosaicBackground = ({ allImages }) => {
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
      <div className="mosaic-overlay" />
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
    return Array.from(map.entries()).map(([url, gameName]) => ({ url, gameName }));
  }, [eligible]);

  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (imageEntries.length < 2) return;
    const id = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % imageEntries.length);
    }, 4000);
    return () => clearInterval(id);
  }, [imageEntries]);

  const fallback = 'https://placehold.co/480x270/0d1117/1e2938?text=';
  const currentSrc = imageEntries[currentIdx]?.url || fallback;
  const gameName = imageEntries[currentIdx]?.gameName || '';

  return (
    <div className={`cat-card ${cssClass} shadow-xl group`}>
      <CrossfadeImage 
        src={currentSrc} 
        className="absolute inset-0 w-full h-full" 
        imgClassName="group-hover:scale-105" 
      />
      <div className="cat-overlay" />
      {gameName && <div className="game-name-overlay">{gameName}</div>}
      <div className="cat-content">
        <div className="cat-count">{eligible.length}</div>
        <div className="cat-name">{title}</div>
      </div>
    </div>
  );
};

export default function Stats({ streamData }) {
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
    const interval = setInterval(() => {
      setLatestBgIndex(prev => (prev + 1) % latestGameImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [latestGameImages]);

  const heroThumb = allImages[0] || '';
  const latestBgImage = latestGameImages[latestBgIndex] || heroThumb;

  return (
    <div className="stats-root" style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <MosaicBackground allImages={allImages} />

      <div className="stats-scroll" style={{ position: 'relative', zIndex: 10, height: '100%', overflowY: 'auto', paddingTop: '16px' }}>
        <div className="divider fade-up" />

        <div className="stats-top-row fade-up delay-1 shadow-2xl">
          <div className="stats-left-col">
            <div className="stat-card">
              <div className="stat-number" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
                {totalStreamsCount.toLocaleString()}
              </div>
              <div className="stat-label">Streams</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
                {totalGamesCount}
              </div>
              <div className="stat-label">Games in Library</div>
            </div>
          </div>

          <div className="stats-right-col">
            <div className="latest-bg">
              <CrossfadeImage src={latestBgImage} alt="latest game" className="w-full h-full" imgClassName="object-cover" />
            </div>
            <div className="latest-content">
              <div className="stat-number drop-shadow-xl" style={{ fontSize: 'clamp(20px, 2.5vw, 32px)', fontWeight: 600, marginBottom: '4px' }}>
                {mostRecentGame?.game_name || '—'}
              </div>
              <div className="stat-sub" style={{ color: 'var(--c-text)', fontSize: '13px', marginTop: '4px' }}>
                Last streamed: <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{timeSinceLastStream}</span>
              </div>
              <div className="stat-sub" style={{ color: 'var(--c-muted)', fontSize: '10px', marginTop: '4px' }}>
                {mostRecentGame?.lastStreamTimestampRaw || 'Unknown'}
              </div>
              <div className="stat-sub" style={{ color: 'var(--c-accent2)', fontSize: '11px', marginTop: '4px' }}>
                {mostRecentGame?.latestRunName || ''}
              </div>
            </div>
          </div>
        </div>

        <div className="cat-row fade-up delay-2">
          <CategoryCard title="Ongoing"   games={games} cssClass="cat-ongoing"   />
          <CategoryCard title="Completed" games={games} cssClass="cat-completed" />
          <CategoryCard title="Abandoned" games={games} cssClass="cat-abandoned" />
        </div>
      </div>
    </div>
  );
}