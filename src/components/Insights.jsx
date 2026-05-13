// src/components/Insights.jsx
import React, { useState, useMemo } from 'react';
import { processInsightsData, PALETTE } from './insights/utils';
import { StatCard, ChartCard, FunCard, HeatmapGrid, LifespanViz } from './insights/UIComponents';
import { 
  StatusPie, BasicBar, StackedBar, SmoothLine, MultiLine, CustomScatter, RadarDNA 
} from './insights/Charts';

export default function Insights({ streamData }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [gameSearch, setGameSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('streams');

  const { 
    GAMES, gameStats, allStreams, 
    totalStreams, totalHours, completed, abandoned, ongoing, avgSession,
    longest, shortest, gaps, maxGap, dayCount, maxDayEntry, firstStreamDate, lastStreamDate
  } = useMemo(() => processInsightsData(streamData), [streamData]);

  if (allStreams.length === 0) return <div className="p-20 text-center text-white/20 font-mono">No stream data available.</div>;

  // Overview Data
  const genreCount = {};
  GAMES.forEach(g => g.genres.forEach(gg => { genreCount[gg] = (genreCount[gg] || 0) + 1; }));
  const genreEntries = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).map(e => ({ name: e[0], value: e[1] }));
  
  const pgSorted = [...gameStats].sort((a, b) => b.streamCount - a.streamCount);
  
  let cum = 0;
  const cumulativePts = [...allStreams].sort((a, b) => a.date - b.date).map((s, i) => {
    cum += s.dur / 3600;
    return { label: new Date(s.date).toLocaleDateString(), hours: parseFloat(cum.toFixed(1)) };
  });

  // Games Data
  const devTypes = { Indie: 0, AAA: 0, MidTier: 0 };
  const aaa = ['FromSoftware', 'Capcom', 'Square Enix', 'Bethesda', 'Ubisoft', 'Xbox Game Studios', 'Deep Silver', 'NEXON', 'Koei Tecmo'];
  const indie = ['Team Cherry', 'LocalThunk', 'Sandfall Interactive', 'GoldFire Studios', 'Sense Games', 'NEOWIZ'];
  gameStats.forEach(g => {
    const isAAA = aaa.some(a => g.developer.includes(a) || g.publisher.includes(a));
    const isIndie = indie.some(i => g.developer.includes(i) || g.publisher.includes(i));
    if (isIndie) devTypes.Indie += g.hours;
    else if (isAAA) devTypes.AAA += g.hours;
    else devTypes.MidTier += g.hours;
  });
  const devTypeData = Object.entries(devTypes).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }));
  const hbSorted = [...gameStats].sort((a, b) => b.hours - a.hours);

  // Time Analysis Data
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = Array(7).fill(0);
  allStreams.forEach(s => counts[new Date(s.date).getDay()]++);
  const orderedCounts = [...counts.slice(1), ...counts.slice(0, 1)];
  const orderedDays = [...DAYS.slice(1), ...DAYS.slice(0, 1)];
  const dowData = orderedDays.map((d, i) => ({ name: d, value: orderedCounts[i] }));

  const buckets = [0, 0, 0, 0, 0, 0, 0];
  const histLabels = ['0-15m', '15-30m', '30-60m', '1-2h', '2-3h', '3-4h', '4h+'];
  allStreams.forEach(s => {
    const m = s.dur / 60;
    if (m < 15) buckets[0]++;
    else if (m < 30) buckets[1]++;
    else if (m < 60) buckets[2]++;
    else if (m < 120) buckets[3]++;
    else if (m < 180) buckets[4]++;
    else if (m < 240) buckets[5]++;
    else buckets[6]++;
  });
  const histData = histLabels.map((l, i) => ({ name: l, value: buckets[i] }));

  const monthly = {};
  allStreams.forEach(s => {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + 1;
  });
  const monthlyData = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0])).map(e => ({ name: e[0], value: e[1] }));
  const gapsPts = gaps.map((g, i) => ({ x: i, y: parseFloat(g.toFixed(2)) })).filter(p => p.y < 60);

  // Patterns Data
  const pubs = {};
  GAMES.forEach(g => {
    g.publisher.split(',').forEach(p => { const t = p.trim(); if (t) pubs[t] = (pubs[t] || 0) + 1; });
  });
  const pubData = Object.entries(pubs).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => ({ name: e[0].substring(0, 20), value: e[1] }));

  const gTotal = {}, gDone = {};
  GAMES.forEach(g => {
    g.genres.forEach(genre => {
      gTotal[genre] = (gTotal[genre] || 0) + 1;
      if (g.status === 'Completed') gDone[genre] = (gDone[genre] || 0) + 1;
    });
  });
  const genreCompData = Object.keys(gTotal).map(g => ({ name: g, value: Math.round((gDone[g] || 0) / gTotal[g] * 100) }));

  const msData = gameStats.map(g => {
    const dMap = {};
    g.streams.forEach(s => { const d = new Date(s.date).toISOString().split('T')[0]; dMap[d] = (dMap[d] || 0) + 1; });
    return { name: g.name.substring(0, 18), value: Object.values(dMap).filter(c => c > 1).length };
  }).filter(g => g.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);

  const pacingData = gameStats.filter(g => g.streamCount > 4).slice(0, 10).map(g => {
    const half = Math.floor(g.streamCount / 2);
    const midpoint = g.firstDate + (g.lastDate - g.firstDate) / 2;
    const early = g.streamCount > 0 ? (g.streams.filter(s => s.date < midpoint).length / g.streamCount) * 100 : 50;
    return { name: g.name.substring(0, 14), early: Math.round(early), late: 100 - Math.round(early) };
  });

  const yrStreams = {};
  gameStats.forEach(g => { yrStreams[g.releaseYear] = (yrStreams[g.releaseYear] || 0) + g.streamCount; });
  const yearData = Object.entries(yrStreams).sort((a, b) => a[0] - b[0]).map(e => ({ name: e[0], value: e[1] }));

  // Fun Facts Data
  const longestGame = gameStats.reduce((m, g) => g.hours > m.hours ? g : m, gameStats[0]);
  const mostBinged = gameStats.reduce((m, g) => {
    const dMap = {}; g.streams.forEach(s => { const d = new Date(s.date).toISOString().split('T')[0]; dMap[d] = (dMap[d] || 0) + 1; });
    const mx = Math.max(...Object.values(dMap), 0); return mx > m.mx ? { ...g, mx } : m;
  }, { mx: 0 });
  const shortValid = gameStats.filter(g => g.streamCount >= 2);
  const shortestGame = shortValid.length ? shortValid.reduce((m, g) => g.hours < m.hours ? g : m, shortValid[0]) : longestGame;
  
  const mostConsistent = gameStats.filter(g => g.streamCount >= 5).reduce((m, g) => {
    const durs = g.streams.map(s => s.dur);
    const mean = durs.reduce((a, b) => a + b, 0) / durs.length;
    const variance = durs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / durs.length;
    const cv = Math.sqrt(variance) / mean;
    return cv < m.cv ? { ...g, cv } : m;
  }, { cv: Infinity });

  const totalDays = Math.max(1, Math.round((lastStreamDate - firstStreamDate) / 86400000));
  const streamDays = Object.keys(dayCount).length;
  const streakInfo = (() => {
    const days = Object.keys(dayCount).sort();
    let best = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      if ((new Date(days[i]) - new Date(days[i - 1])) / 86400000 === 1) { cur++; best = Math.max(best, cur); } else cur = 1;
    }
    return best;
  })();

  const radarData = Object.entries(gameStats.reduce((acc, g) => { g.genres.forEach(gg => { acc[gg] = (acc[gg] || 0) + g.hours; }); return acc; }, {})).map(e => ({ subject: e[0], A: parseFloat(e[1].toFixed(1)), fullMark: 100 }));
  const trendData = [...gameStats].sort((a, b) => b.streamCount - a.streamCount).slice(0, 5).map((g, i) => {
    const sorted = [...g.streams].sort((a, b) => a.date - b.date);
    return {
      label: g.name.substring(0, 16),
      borderColor: PALETTE[i],
      data: sorted.map((s, idx) => {
        const window = sorted.slice(Math.max(0, idx - 2), idx + 3);
        return { x: idx + 1, y: parseFloat((window.reduce((a, b) => a + b.dur / 60, 0) / window.length).toFixed(1)) };
      })
    };
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg: #0a0a0f; --surface: #12121a; --surface2: #1a1a28; --surface3: #22223a;
          --border: rgba(255,255,255,0.07); --border2: rgba(255,255,255,0.13);
          --text: #f0eeff; --muted: #8a88a8;
          --accent: #7c6cfa; --accent2: #fa6ca0; --accent3: #6cfacc; --accent4: #fac86c; --accent5: #6cb4fa;
          --r: 12px; --r-sm: 6px;
        }
        .ins-page { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; min-height: 100%; position: relative; z-index: 1; padding: 2rem 1.5rem 4rem; overflow-x: hidden; }
        .ins-page::before { content: ''; position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.02)' stroke-width='0.5'/%3E%3C/svg%3E"); pointer-events: none; z-index: 0; }
        .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 1rem; position: relative; z-index: 2;}
        .header-left h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, #fff 0%, var(--accent) 60%, var(--accent2) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1; margin:0;}
        .header-left .sub { color: var(--muted); font-size: 0.85rem; margin-top: 0.3rem; font-family: 'Space Mono', monospace; }
        .export-date { background: var(--surface2); border: 1px solid var(--border2); border-radius: var(--r-sm); padding: 0.5rem 1rem; font-size: 0.75rem; font-family: 'Space Mono', monospace; color: var(--muted); }
        .tab-nav { display: flex; gap: 0.25rem; margin-bottom: 2rem; background: var(--surface); border-radius: var(--r); padding: 0.25rem; border: 1px solid var(--border); flex-wrap: wrap; position: relative; z-index: 2;}
        .tab-btn { flex: 1; min-width: 100px; padding: 0.55rem 1rem; border: none; border-radius: var(--r-sm); background: transparent; color: var(--muted); font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .tab-btn.active { background: var(--accent); color: #fff; }
        .tab-btn:hover:not(.active) { background: var(--surface2); color: var(--text); }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; position: relative; z-index: 2;}
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 1.2rem; position: relative; overflow: hidden; transition: border-color 0.2s; }
        .stat-card:hover { border-color: var(--border2); }
        .stat-card::before { content: ''; position: absolute; top: 0; right: 0; width: 60px; height: 60px; border-radius: 50%; opacity: 0.08; transform: translate(20px, -20px); }
        .stat-card.purple::before { background: var(--accent); } .stat-card.pink::before { background: var(--accent2); } .stat-card.teal::before { background: var(--accent3); } .stat-card.amber::before { background: var(--accent4); } .stat-card.blue::before { background: var(--accent5); }
        .stat-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 0.5rem; }
        .stat-value { font-size: 2rem; font-weight: 800; line-height: 1; margin-bottom: 0.3rem; }
        .stat-value.purple { color: var(--accent); } .stat-value.pink { color: var(--accent2); } .stat-value.teal { color: var(--accent3); } .stat-value.amber { color: var(--accent4); } .stat-value.blue { color: var(--accent5); }
        .stat-sub { font-size: 0.72rem; color: var(--muted); font-family: 'Space Mono', monospace; }
        .section-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: var(--muted); margin-bottom: 0.9rem; display: flex; align-items: center; gap: 0.5rem; position: relative; z-index: 2;}
        .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 1.25rem; margin-bottom: 1.25rem; position: relative; z-index: 2;}
        .chart-title { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.3rem; color: var(--text); }
        .chart-sub { font-size: 0.72rem; color: var(--muted); font-family: 'Space Mono', monospace; margin-bottom: 1rem; }
        .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
        @media (max-width: 900px) { .chart-row { grid-template-columns: 1fr; } }
        .fun-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; position: relative; z-index: 2;}
        .fun-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 1.1rem 1.2rem; position: relative; overflow: hidden; }
        .fun-card::before { content: attr(data-emoji); position: absolute; right: 1rem; top: 0.8rem; font-size: 1.6rem; opacity: 0.3; }
        .fun-card .fun-title { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 0.4rem; }
        .fun-card .fun-value { font-size: 1.1rem; font-weight: 700; color: var(--accent); margin-bottom: 0.2rem; }
        .fun-card .fun-desc { font-size: 0.75rem; color: var(--muted); line-height: 1.5; }
        .heatmap-grid { display: grid; grid-template-columns: 40px repeat(24, 1fr); gap: 3px; font-size: 0.6rem; font-family: 'Space Mono', monospace; overflow-x: auto; }
        .hm-row-label { color: var(--muted); display: flex; align-items: center; justify-content: flex-end; padding-right: 6px; font-size: 0.6rem; height: 18px; }
        .hm-cell { height: 18px; border-radius: 3px; background: var(--surface3); transition: transform 0.15s; cursor: default; }
        .hm-cell:hover { transform: scale(1.2); z-index: 10; }
        .hm-hour-label { color: var(--muted); text-align: center; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; }
        .annotation { background: rgba(124, 108, 250, 0.08); border-left: 3px solid var(--accent); border-radius: 0 var(--r-sm) var(--r-sm) 0; padding: 0.5rem 0.8rem; font-size: 0.75rem; color: var(--muted); margin-top: 0.8rem; line-height: 1.5; }
        .annotation strong { color: var(--accent); }
        .progress-row { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.6rem; }
        .progress-label { font-size: 0.75rem; color: var(--text); min-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .progress-bar-wrap { flex: 1; height: 8px; background: var(--surface3); border-radius: 4px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
        .progress-val { font-size: 0.72rem; font-family: 'Space Mono', monospace; color: var(--muted); min-width: 60px; text-align: right; }
        .game-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
        .game-table th { text-align: left; padding: 0.6rem 0.8rem; color: var(--muted); font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); }
        .game-table td { padding: 0.7rem 0.8rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .game-table tr:hover td { background: var(--surface2); }
        .status-badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; font-family: 'Space Mono', monospace; }
        .status-Completed { background: rgba(74,222,128,0.15); color: #4ade80; }
        .status-Abandoned { background: rgba(248,113,113,0.15); color: #f87171; }
        .status-Ongoing { background: rgba(251,191,36,0.15); color: #fbbf24; }
      `}} />

      <div className="ins-page overflow-y-auto custom-scrollbar h-full w-full">
        <div className="header">
          <div className="header-left">
            <h1>Stream Insights</h1>
            <div className="sub">// data.export — {new Date().toLocaleDateString('en-CA').replace(/-/g, '.')} — full backup v2.0.0</div>
          </div>
          <div className="export-date">📡 Live from your stream library</div>
        </div>

        <div className="tab-nav">
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`tab-btn ${activeTab === 'games' ? 'active' : ''}`} onClick={() => setActiveTab('games')}>Games</button>
          <button className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`} onClick={() => setActiveTab('time')}>Time Analysis</button>
          <button className={`tab-btn ${activeTab === 'patterns' ? 'active' : ''}`} onClick={() => setActiveTab('patterns')}>Patterns</button>
          <button className={`tab-btn ${activeTab === 'funfacts' ? 'active' : ''}`} onClick={() => setActiveTab('funfacts')}>Fun Facts</button>
        </div>

        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-500">
            <div className="stat-grid">
              <StatCard label="Total Games" value={GAMES.length} sub="in library" colorClass="purple" />
              <StatCard label="Total Streams" value={totalStreams} sub="across all games" colorClass="pink" />
              <StatCard label="Hours Streamed" value={totalHours.toFixed(0)} sub="total duration" colorClass="teal" />
              <StatCard label="Completed" value={completed} sub="games finished" colorClass="amber" />
              <StatCard label="Abandoned" value={abandoned} sub="dropped" colorClass="blue" />
              <StatCard label="Avg Session" value={Math.round(avgSession)} sub="minutes/stream" colorClass="purple" />
            </div>
            <div className="chart-row">
              <ChartCard title="Status Distribution" sub="completion vs abandonment ratio" height={260}>
                <StatusPie data={[{ name: 'Completed', value: completed }, { name: 'Abandoned', value: abandoned }, { name: 'Ongoing', value: ongoing }]} />
              </ChartCard>
              <ChartCard title="Genre Breakdown" sub="genre tags across all games" height={260}>
                <BasicBar data={genreEntries} dataKey="value" xKey="name" colors={PALETTE} />
              </ChartCard>
            </div>
            <ChartCard title="Streams Per Game — All Time" sub="sorted by total stream count" height={pgSorted.length * 38 + 60}>
              <BasicBar data={pgSorted.map(g => ({ name: g.name.substring(0, 28), value: g.streamCount, fill: g.status === 'Completed' ? '#6cfacc' : g.status === 'Ongoing' ? '#fac86c' : '#f87171' }))} dataKey="value" xKey="name" isVertical formatTooltip={v => `${v} streams`} />
            </ChartCard>
            <ChartCard title="Cumulative Hours Over Time" sub="how your stream library grew" height={280}>
              <SmoothLine data={cumulativePts} dataKey="hours" xKey="label" color="#7c6cfa" formatTooltip={v => `${v}h`} fill />
            </ChartCard>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="animate-in fade-in duration-500">
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
              <input type="text" placeholder="Search games…" value={gameSearch} onChange={e => setGameSearch(e.target.value)} style={{ flex: 1, minWidth: '180px', padding: '0.5rem 0.8rem', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontFamily: '"Syne",sans-serif', fontSize: '0.82rem' }} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem 0.8rem', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontFamily: '"Syne",sans-serif', fontSize: '0.82rem' }}>
                <option value="">All Statuses</option><option value="Completed">Completed</option><option value="Abandoned">Abandoned</option><option value="Ongoing">Ongoing</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '0.5rem 0.8rem', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontFamily: '"Syne",sans-serif', fontSize: '0.82rem' }}>
                <option value="streams">Sort: Streams</option><option value="hours">Sort: Hours</option><option value="name">Sort: Name</option><option value="avg">Sort: Avg Session</option><option value="year">Sort: Release Year</option>
              </select>
            </div>
            <ChartCard noPadding>
              <div style={{ overflowX: 'auto' }}>
                <table className="game-table">
                  <thead>
                    <tr><th>Game</th><th>Status</th><th>Streams</th><th>Hours</th><th>Avg Session</th><th>Developer</th><th>Release</th><th>Genres</th></tr>
                  </thead>
                  <tbody>
                    {[...gameStats].filter(g => (!gameSearch || g.name.toLowerCase().includes(gameSearch.toLowerCase())) && (!statusFilter || g.status === statusFilter))
                      .sort((a, b) => {
                        if (sortBy === 'streams') return b.streamCount - a.streamCount;
                        if (sortBy === 'hours') return b.hours - a.hours;
                        if (sortBy === 'name') return a.name.localeCompare(b.name);
                        if (sortBy === 'avg') return b.avg - a.avg;
                        if (sortBy === 'year') return b.releaseYear - a.releaseYear;
                        return 0;
                      }).map(g => (
                        <tr key={g.id}>
                          <td style={{ fontWeight: 600, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</td>
                          <td><span className={`status-badge status-${g.status}`}>{g.status}</span></td>
                          <td className="mono" style={{ textAlign: 'right' }}>{g.streamCount}</td>
                          <td className="mono" style={{ textAlign: 'right' }}>{g.hours.toFixed(1)}h</td>
                          <td className="mono" style={{ textAlign: 'right' }}>{Math.round(g.avg)}m</td>
                          <td style={{ fontSize: '0.72rem', color: 'var(--muted)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.developer}</td>
                          <td className="mono" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{g.releaseYear}</td>
                          <td style={{ fontSize: '0.68rem' }}>{g.genres.map(gg => <span key={gg} className="genre-pill">{gg}</span>)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
            <div className="chart-row mt-5">
              <ChartCard title="Hours by Developer Type" sub="indie vs aaa vs mid-tier" height={240}>
                <BasicBar data={devTypeData} dataKey="value" xKey="name" colors={['#6cfacc', '#7c6cfa', '#fac86c']} formatTooltip={v => `${v}h`} />
              </ChartCard>
              <ChartCard title="Sessions Per Game — Scatter" sub="avg session length vs total streams" height={240}>
                <CustomScatter data={gameStats.map(g => ({ x: g.streamCount, y: parseFloat(g.avg.toFixed(1)), label: g.name, status: g.status }))} />
              </ChartCard>
            </div>
            <ChartCard title="Hours Per Game — Ranked" sub="total time invested per title" height={hbSorted.length * 38 + 60}>
              <BasicBar data={hbSorted.map(g => ({ name: g.name.substring(0, 28), value: parseFloat(g.hours.toFixed(1)) }))} dataKey="value" xKey="name" isVertical colors={PALETTE} formatTooltip={v => `${v}h`} />
            </ChartCard>
          </div>
        )}

        {activeTab === 'time' && (
          <div className="animate-in fade-in duration-500">
            <div className="stat-grid">
              <StatCard label="Busiest Day" value={maxDayEntry[0] ? new Date(maxDayEntry[0]).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'} sub={maxDayEntry[0] ? new Date(maxDayEntry[0]).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} colorClass="purple" />
              <StatCard label="Longest Stream" value={longest ? `${Math.round(longest.dur / 60)}m` : '—'} sub={longest ? `${longest.game.substring(0, 20)}…` : ''} colorClass="pink" />
              <StatCard label="Shortest Stream" value={shortest ? `${Math.round(shortest.dur / 60)}m` : '—'} sub={shortest ? `${shortest.game.substring(0, 20)}…` : ''} colorClass="teal" />
              <StatCard label="Most Streams/Day" value={maxDayEntry[1]} sub={maxDayEntry[0] ? new Date(maxDayEntry[0]).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} colorClass="amber" />
              <StatCard label="Longest Gap" value={`${Math.round(maxGap)}d`} sub="between any two streams" colorClass="blue" />
              <StatCard label="First Stream" value={firstStreamDate.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })} sub={`to ${lastStreamDate.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`} colorClass="purple" />
            </div>
            <ChartCard title="Activity Heatmap — Hour of Day × Day of Week" sub="when you actually stream" height="auto">
              <HeatmapGrid allStreams={allStreams} />
            </ChartCard>
            <div className="chart-row">
              <ChartCard title="Streams by Day of Week" sub="your weekly rhythm" height={240}>
                <BasicBar data={dowData} dataKey="value" xKey="name" colors={PALETTE} />
              </ChartCard>
              <ChartCard title="Session Length Distribution" sub="how long do streams run?" height={240}>
                <BasicBar data={histData} dataKey="value" xKey="name" color="#6cb4fa" />
              </ChartCard>
            </div>
            <ChartCard title="Monthly Activity — Streams per Month" sub="stream frequency over time" height={280}>
              <BasicBar data={monthlyData} dataKey="value" xKey="name" color="#7c6cfa" />
            </ChartCard>
            <ChartCard title="Gap Between Consecutive Streams" sub="days between each stream session" height={220}>
              <SmoothLine data={gapsPts} dataKey="y" xKey="x" color="#fa6ca0" fill formatTooltip={v => `${v}d gap`} />
            </ChartCard>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="animate-in fade-in duration-500">
            <div className="section-title">Publisher & Developer Network</div>
            <div className="chart-row">
              <ChartCard title="Top Publishers" sub="by games published in your library" height={240}>
                <BasicBar data={pubData} dataKey="value" xKey="name" isVertical color="#c084fc" />
              </ChartCard>
              <ChartCard title="Completion Rate by Genre" sub="which genres get finished?" height={240}>
                <BasicBar data={genreCompData} dataKey="value" xKey="name" colors={PALETTE} formatTooltip={v => `${v}%`} />
              </ChartCard>
            </div>
            <ChartCard title="Timeline: Game Lifespan" sub="start → end date of each game's streaming run" height="auto">
              <LifespanViz gameStats={gameStats} />
            </ChartCard>
            <div className="section-title">Binge Analysis</div>
            <div className="chart-row">
              <ChartCard title="Same-Day Multi-Session Count" sub="how often did you stream multiple times in one day?" height={220}>
                <BasicBar data={msData} dataKey="value" xKey="name" isVertical color="#fac86c" formatTooltip={v => `${v} multi-session days`} />
              </ChartCard>
              <ChartCard title="Stream Pacing — Normalized Timeline" sub="early vs late activity concentration per game" height={220}>
                <StackedBar data={pacingData} keys={['early', 'late']} colors={['#7c6cfa', '#fa6ca0']} />
              </ChartCard>
            </div>
            <ChartCard title="Streams by Release Year of Game" sub="do you prefer new releases or classics?" height={240}>
              <BasicBar data={yearData} dataKey="value" xKey="name" colors={['#6cb4fa', '#6cfacc', '#7c6cfa']} formatTooltip={v => `${v} streams`} />
            </ChartCard>
          </div>
        )}

        {activeTab === 'funfacts' && (
          <div className="animate-in fade-in duration-500">
            <div className="section-title">Deeply Useless But Accurate Facts</div>
            <div className="fun-grid">
              <FunCard emoji="🏆" title="Most Streamed Game" value={longestGame.name.substring(0, 24)} desc={`${longestGame.hours.toFixed(1)} hours across ${longestGame.streamCount} sessions. That's ${Math.round(longestGame.hours * 60 / longestGame.streamCount)} min/stream.`} />
              <FunCard emoji="🔥" title="Biggest Single-Day Binge" value={`${mostBinged.mx} sessions`} desc={`You played ${mostBinged.name.substring(0, 20)} ${mostBinged.mx} times in one day. Legend or concerning? Both.`} />
              <FunCard emoji="💀" title="Quickest Dropout" value={shortestGame.name.substring(0, 22)} desc={`Only ${shortestGame.hours.toFixed(1)}h total. Gone like a morning breeze.`} />
              <FunCard emoji="🎯" title="Most Consistent Sessions" value={mostConsistent.name.substring(0, 22)} desc={`Coefficient of variation: ${(mostConsistent.cv * 100).toFixed(0)}%. You always knew how long you'd play.`} />
              <FunCard emoji="📅" title="Streaming Density" value={`${((streamDays / totalDays) * 100).toFixed(0)}%`} desc={`${streamDays} of ${totalDays} days had at least one stream. Active ${streamDays} days total.`} />
              <FunCard emoji="⚡" title="Longest Streak" value={`${streakInfo} days`} desc="Consecutive days with at least one stream. Dedication." />
              <FunCard emoji="📊" title="Average Gap Between Streams" value={`${gaps.length ? (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) : 0} days`} desc={`On average, this is how long you went between sessions across all ${gaps.length} transitions.`} />
              <FunCard emoji="🎮" title="Action Genre Dominance" value={`${Math.round(GAMES.filter(g => g.genres.includes('Action')).length / Math.max(GAMES.length, 1) * 100)}%`} desc={`${GAMES.filter(g => g.genres.includes('Action')).length} of ${GAMES.length} games have Action in their tags. You are an action gamer.`} />
              <FunCard emoji="🌑" title="FromSoftware Loyalty" value={`${GAMES.filter(g => g.developer.includes('FromSoftware')).length} games`} desc="Dark Souls Remastered + Elden Ring Nightreign. The pain is intentional." />
              <FunCard emoji="🏃" title="Abandon Rate" value={`${Math.round(abandoned / Math.max(GAMES.length, 1) * 100)}%`} desc={`${abandoned} out of ${GAMES.length} games were abandoned. ${completed} completed. You finish what you love.`} />
              <FunCard emoji="⏱️" title="Total Stream Time" value={`${totalHours.toFixed(0)}h`} desc={`That's ${(totalHours / 24).toFixed(1)} full days, or ${(totalHours / 8).toFixed(0)} 8-hour workdays. Gaming is your second job.`} />
              <FunCard emoji="🚀" title="2025 Game Preference" value={`${GAMES.filter(g => g.releaseYear === 2025).length} of ${GAMES.length}`} desc={`You strongly prefer new releases. ${GAMES.filter(g => g.releaseYear === 2025).length} games from 2025 in your library.`} />
            </div>

            <div className="section-title">Genre DNA</div>
            <ChartCard title="Your Genre Fingerprint" sub="weighted by hours played" height={300}>
              <RadarDNA data={radarData} />
            </ChartCard>

            <div className="section-title">Hypothetical Metrics</div>
            <div className="fun-grid">
              <FunCard emoji="☕" title="Coffee Cups Consumed" value={`~${Math.round(totalHours * 1.5)} cups`} desc={`Assuming 1.5 cups/hr of gaming. That's ${Math.round(totalHours * 1.5 * 250)}ml of coffee, or ${(totalHours * 1.5 * 250 / 1000).toFixed(0)}L.`} />
              <FunCard emoji="🖱️" title="Mouse Clicks Estimated" value={`${(totalStreams * 800).toLocaleString()} clicks`} desc="At ~800 clicks per stream session. Your mouse has earned a vacation." />
              <FunCard emoji="🌍" title="Carbon Offset Equivalent" value={`~${(totalHours * 0.06).toFixed(1)}kg CO₂`} desc={`At avg PC gaming emissions. You owe the planet ${Math.round(totalHours * 0.06 / 0.0175)} tree-hours.`} />
              <FunCard emoji="🌙" title="All-Nighters Equivalent" value={`${Math.round(totalHours / 8)} nights`} desc="If you streamed continuously instead of sleeping. Your eyes hurt just thinking about it." />
            </div>

            <ChartCard title="Session Length vs Hours to 100 Streams" sub="how session length changed as you streamed more of a game" height={280}>
              <MultiLine datasets={trendData} />
            </ChartCard>
          </div>
        )}
      </div>
    </>
  );
}