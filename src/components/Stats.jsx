import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseCustomTimestamp } from '../utils/helpers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getLatestRunWithTimestamp = (cycles) => {
  let latestRun = null;
  let latestDate = null;
  Object.entries(cycles).forEach(([runId, run]) => {
    const timestamps = run.timestamps || [];
    if (timestamps.length > 0) {
      const lastTimestampStr = timestamps[timestamps.length - 1];
      const date = parseCustomTimestamp(lastTimestampStr);
      if (!latestDate || date > latestDate) {
        latestDate = date;
        latestRun = { run, timestamp: lastTimestampStr, date };
      }
    } else if (!latestDate && run.stream_count > 0) {
      latestRun = { run, timestamp: null, date: null };
    }
  });
  return latestRun;
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  .stats-root {
    --c-bg:      #080a0f;
    --c-surface: #0d1117;
    --c-border:  rgba(255,255,255,0.07);
    --c-accent:  #e8c87a;
    --c-accent2: #6eb5ff;
    --c-text:    #f0ece4;
    --c-muted:   rgba(240,236,228,0.45);
    --c-green:   #3ddc84;
    --c-orange:  #f5a623;
    --c-red:     #ff5c5c;
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--c-bg);
    color: var(--c-text);
  }
  .stats-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .stats-scroll::-webkit-scrollbar { width: 4px; }
  .stats-scroll::-webkit-scrollbar-track { background: transparent; }
  .stats-scroll::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }

  /* ── Mosaic strip ── */
  .mosaic-wrap {
    position: absolute; inset: 0; overflow: hidden; pointer-events: none;
  }
  .mosaic-rows {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .mosaic-row {
    flex: 1;
    display: flex;
    align-items: stretch;
    will-change: transform;
  }
  .mosaic-img {
    flex-shrink: 0;
    width: 110px;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .mosaic-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(8,10,15,0.82) 0%,
      rgba(8,10,15,0.70) 40%,
      rgba(8,10,15,0.88) 100%
    );
  }

  /* ── Layout ── */
  .divider {
    height: 1px;
    background: linear-gradient(to right, var(--c-accent), transparent);
    margin: 18px 24px;
    opacity: 0.5;
  }
  .stats-top-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
    margin: 0 24px;
    background: var(--c-border);
    border: 1px solid var(--c-border);
    border-radius: 2px;
    overflow: hidden;
  }
  .stats-left-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--c-border);
    gap: 1px;
  }
  .stats-right-col {
    flex: 1;
    background: rgba(13,17,23,0.35);
    backdrop-filter: blur(4px);
    position: relative;
    overflow: hidden;
  }

  /* ── Stat cards (highly transparent) ── */
  .stat-card {
    background: rgba(13,17,23,0.35);
    backdrop-filter: blur(4px);
    padding: 18px 16px;
    position: relative;
    overflow: hidden;
    transition: background 0.25s;
  }
  .stat-card:hover {
    background: rgba(20,26,36,0.5);
  }
  .stat-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(to right, var(--c-accent), transparent);
    opacity: 0;
    transition: opacity 0.25s;
  }
  .stat-card:hover::before { opacity: 1; }
  .stat-number {
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--c-text);
    transition: color 0.2s;
  }
  .stat-card:hover .stat-number { color: var(--c-accent); }
  .stat-label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--c-muted);
    margin-top: 6px;
  }
  .stat-sub {
    font-size: 11px;
    color: var(--c-accent2);
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Latest card ── */
  .latest-bg {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 0;
  }
  .latest-bg img {
    width: 100%; height: 100%; object-fit: cover;
    transition: opacity 0.8s ease;
  }
  .latest-content {
    position: relative; z-index: 1;
    padding: 18px 16px;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(2px);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* ── Category cards ── */
  .cat-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin: 18px 24px;
  }
  @media (min-width: 640px) { .cat-row { grid-template-columns: repeat(3, 1fr); } }
  .cat-card {
    position: relative; overflow: hidden;
    border: 1px solid var(--c-border);
    border-radius: 2px;
    aspect-ratio: 16/9;
    cursor: default;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .cat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
  }
  .cat-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%; object-fit: cover;
  }
  .cat-img-next {
    opacity: 0;
    transition: opacity 0.8s ease;
  }
  .cat-card.fading .cat-img-next { opacity: 1; }
  .cat-card:hover .cat-img-current {
    transform: scale(1.04);
    transition: transform 0.6s ease;
  }
  .cat-overlay {
    position: absolute; inset: 0; z-index: 1;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%);
  }
  .cat-content {
    position: absolute; inset: 0; z-index: 2;
    display: flex; flex-direction: column;
    justify-content: flex-end; padding: 12px 14px;
  }
  .cat-count {
    font-weight: 600; font-size: 44px;
    line-height: 1; letter-spacing: -0.02em; color: #fff;
  }
  .cat-name {
    font-size: 10px; letter-spacing: 0.2em;
    text-transform: uppercase; margin-top: 2px;
  }
  .cat-ongoing .cat-name   { color: var(--c-green); }
  .cat-completed .cat-name { color: var(--c-orange); }
  .cat-abandoned .cat-name { color: var(--c-red); }
  .game-name-overlay {
    position: absolute; top: 12px; left: 12px; z-index: 3;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 500; color: white;
    pointer-events: none; white-space: nowrap;
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up  { animation: fadeUp 0.6s ease both; }
  .delay-1  { animation-delay: 0.1s; }
  .delay-2  { animation-delay: 0.2s; }
  .delay-3  { animation-delay: 0.3s; }
`;

// ─── MosaicBackground ─────────────────────────────────────────────────────────

const ROW_COUNT    = 6;
const IMG_W        = 110;
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
  }, []);

  useEffect(() => {
    const STRIP_W = IMGS_PER_ROW * IMG_W;
    const state = Array.from({ length: ROW_COUNT }, (_, i) => {
      const base = 0.18 + Math.random() * 0.14;
      return {
        dir:           i % 2 === 0 ? -1 : 1,
        pos:           i % 2 === 0 ? 0 : -STRIP_W,
        speed:         base,
        targetSpeed:   base,
        baseSpeed:     base,
        pauseTimer:    Math.floor(Math.random() * 300),
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
          <div
            key={ri}
            className="mosaic-row"
            ref={el => { rowRefs.current[ri] = el; }}
          >
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

// ─── CategoryCard ─────────────────────────────────────────────────────────────

const CategoryCard = ({ title, games, cssClass }) => {
  const eligible = useMemo(
    () => games.filter(g => g.latestRunLabel === title),
    [games, title]
  );

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
  const [nextIdx,    setNextIdx]    = useState(1);
  const [fading,     setFading]     = useState(false);
  const currentIdxRef = useRef(0);

  useEffect(() => {
    setCurrentIdx(0);
    setNextIdx(imageEntries.length > 1 ? 1 : 0);
    setFading(false);
    currentIdxRef.current = 0;
  }, [imageEntries]);

  useEffect(() => {
    if (imageEntries.length < 2) return;
    const id = setInterval(() => {
      const cur  = currentIdxRef.current;
      const next = (cur + 1) % imageEntries.length;
      setNextIdx(next);
      setFading(true);
      setTimeout(() => {
        currentIdxRef.current = next;
        setCurrentIdx(next);
        setFading(false);
      }, 900);
    }, 4000);
    return () => clearInterval(id);
  }, [imageEntries]);

  const fallback   = 'https://placehold.co/480x270/0d1117/1e2938?text=';
  const currentSrc = imageEntries[currentIdx]?.url  || fallback;
  const nextSrc    = imageEntries[nextIdx]?.url      || fallback;
  const gameName   = imageEntries[currentIdx]?.gameName || '';

  return (
    <div className={`cat-card ${cssClass}${fading ? ' fading' : ''}`}>
      <img className="cat-img cat-img-current" src={currentSrc} alt={title} />
      <img className="cat-img cat-img-next"    src={nextSrc}    alt="" />
      <div className="cat-overlay" />
      {gameName && <div className="game-name-overlay">{gameName}</div>}
      <div className="cat-content">
        <div className="cat-count">{eligible.length}</div>
        <div className="cat-name">{title}</div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Stats({
  streamData,
  mosaicXGap = 0,
  mosaicYGap = 0,
  statsCardRadius = 12,
  statsCardPadding = 12,
}) {
  const styleInjected = useRef(false);
  const [latestBgIndex, setLatestBgIndex] = useState(0);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement('style');
    el.textContent = STYLES;
    document.head.appendChild(el);
  }, []);

  const games = useMemo(() =>
    Object.entries(streamData).map(([id, data]) => {
      const cycles = data.cycles || {};
      const totalStreams = Object.values(cycles).reduce((acc, c) => acc + (c.stream_count || 0), 0);
      const latestRunInfo = getLatestRunWithTimestamp(cycles);
      const latestRunLabel = latestRunInfo ? (latestRunInfo.run.label || 'Ongoing') : 'Ongoing';
      const lastStreamTimestampMs = latestRunInfo?.date ? latestRunInfo.date.getTime() : null;
      const lastStreamTimestampRaw = latestRunInfo?.timestamp || null;
      const latestRunName = latestRunInfo?.run.displayName || (latestRunInfo?.run.id === 'main' ? 'First Playthrough' : latestRunInfo?.run.id?.replace(/_/g, ' '));
      return {
        id,
        ...data,
        totalStreams,
        latestRunLabel,
        lastStreamTimestampMs,
        lastStreamTimestampRaw,
        latestRunName,
        thumbnail_urls: data.thumbnail_urls || []
      };
    }),
  [streamData]);

  const allImages = useMemo(
    () => games.flatMap(g => g.thumbnail_urls || []).filter(Boolean),
    [games]
  );

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

  const heroThumb     = allImages[0] || '';
  const latestBgImage = latestGameImages[latestBgIndex] || heroThumb;

  return (
    <div className="stats-root" style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>

      <MosaicBackground allImages={allImages} />

      <div className="stats-scroll" style={{ position: 'relative', zIndex: 10, height: '100%', overflowY: 'auto' }}>

        <div className="divider fade-up" />

        <div className="stats-top-row fade-up delay-1">
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
              <div className="stat-label">Library</div>
            </div>
          </div>

          <div className="stats-right-col">
            <div className="latest-bg">
              <img src={latestBgImage} alt="latest game" />
            </div>
            <div className="latest-content">
              <div className="stat-number" style={{ fontSize: 'clamp(20px, 2.5vw, 32px)', fontWeight: 600, marginBottom: '4px' }}>
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