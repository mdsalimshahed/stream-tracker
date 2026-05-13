// src/components/Insights.jsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { parseCustomTimestamp, formatDuration } from '../utils/helpers';
import { getLowResUrl } from '../utils/helpers';

// ─── DATA PROCESSING HELPERS ────────────────────────────────────────────────

const getAllTimestamps = (streamData) => {
  const result = [];
  Object.entries(streamData).forEach(([gameId, game]) => {
    Object.entries(game.cycles || {}).forEach(([cycleId, cycle]) => {
      (cycle.timestamps || []).forEach((ts, idx) => {
        const date = parseCustomTimestamp(ts);
        result.push({
          gameId, gameName: game.game_name,
          cycleName: cycle.displayName || cycleId,
          cover: game.cover_image || game.thumbnail_urls?.[0],
          ts, idx,
          date,
          duration: ts.duration || 0,
          startTime: ts.startTime || ts.date || 0,
          endTime: ts.endTime || null,
          videoId: ts.videoId || null,
          uptimeSecs: ts.startTime && ts.endTime
            ? Math.floor((ts.endTime - ts.startTime) / 1000) : null,
          deficit: ts.startTime && ts.endTime && ts.duration
            ? Math.floor((ts.endTime - ts.startTime) / 1000) - ts.duration : null,
        });
      });
    });
  });
  return result.filter(t => t.date > new Date(2000, 0, 1));
};

const getAllGames = (streamData) => {
  return Object.entries(streamData).map(([gameId, game]) => {
    const cycles = game.cycles || {};
    const allTs = [];
    Object.entries(cycles).forEach(([cId, cycle]) => {
      (cycle.timestamps || []).forEach(ts => allTs.push({ ...ts, cycleId: cId, cycleName: cycle.displayName || cId }));
    });
    const totalDuration = allTs.reduce((a, t) => a + (t.duration || 0), 0);
    const totalStreams = Object.values(cycles).reduce((a, c) => a + (c.stream_count || 0), 0);
    const labels = Object.values(cycles).map(c => c.label || 'Ongoing');
    const dominantLabel = labels.includes('Completed') ? 'Completed' : labels.includes('Ongoing') ? 'Ongoing' : 'Abandoned';
    const lastDate = allTs.reduce((latest, t) => {
      const d = parseCustomTimestamp(t);
      return d > latest ? d : latest;
    }, new Date(0));
    return { gameId, gameName: game.game_name, cover: game.cover_image || game.thumbnail_urls?.[0], thumbnails: game.thumbnail_urls || [], totalDuration, totalStreams, label: dominantLabel, lastDate, cycles };
  });
};

// ─── ANIMATED COUNT-UP ───────────────────────────────────────────────────────

const useCountUp = (target, duration = 1400, format = (v) => Math.round(v).toLocaleString()) => {
  const [display, setDisplay] = useState('0');
  const raf = useRef(null);
  useEffect(() => {
    if (!target && target !== 0) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(format(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return display;
};

// ─── INTERSECTION OBSERVER HOOK ──────────────────────────────────────────────

const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

// ─── INLINE BAR CHART ────────────────────────────────────────────────────────

const HBar = ({ value, max, color = '#e8c87a', delay = 0, inView }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
      <div style={{
        height: '100%', width: inView ? `${pct}%` : '0%',
        background: color, borderRadius: 3,
        transition: `width 1s cubic-bezier(0.2,0.8,0.2,1) ${delay}s`,
      }} />
    </div>
  );
};

// ─── SECTION HEADER ──────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0ece4', letterSpacing: '0.03em', margin: 0 }}>{title}</h2>
    </div>
    {subtitle && <p style={{ fontSize: 12, color: 'rgba(240,236,228,0.4)', marginTop: 4, marginLeft: 32, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{subtitle}</p>}
  </div>
);

// ─── STAT HERO CARD ──────────────────────────────────────────────────────────

const HeroCard = ({ cover, label, sublabel, value, unit, accent = '#e8c87a', span = 1 }) => {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      gridColumn: `span ${span}`,
      position: 'relative', overflow: 'hidden', borderRadius: 2,
      border: '1px solid rgba(255,255,255,0.08)',
      minHeight: 160,
      background: cover ? 'transparent' : 'rgba(0,0,0,0.5)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 48px rgba(0,0,0,0.7)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {cover && (
        <>
          <img src={getLowResUrl(cover, false)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.4) 100%)' }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 1, padding: 20, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end' }}>
        <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {inView ? value : '—'}
          {unit && <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,236,228,0.5)', marginLeft: 5 }}>{unit}</span>}
        </div>
        {sublabel && <div style={{ fontSize: 12, color: 'rgba(240,236,228,0.55)', marginTop: 6, lineHeight: 1.4 }}>{sublabel}</div>}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${accent}, transparent)`, opacity: 0.7 }} />
      </div>
    </div>
  );
};

// ─── HOUR OF DAY POLAR CHART ─────────────────────────────────────────────────

const HourPolarChart = ({ hourCounts }) => {
  const [ref, inView] = useInView(0.2);
  const [hovered, setHovered] = useState(null);
  const size = 220;
  const cx = size / 2, cy = size / 2;
  const maxCount = Math.max(...hourCounts, 1);

  const segments = hourCounts.map((count, hour) => {
    const startAngle = (hour / 24) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((hour + 1) / 24) * 2 * Math.PI - Math.PI / 2;
    const innerR = 28;
    const outerR = innerR + (inView ? (count / maxCount) * 78 : 0);
    const x1 = cx + innerR * Math.cos(startAngle);
    const y1 = cy + innerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(startAngle);
    const y2 = cy + outerR * Math.sin(startAngle);
    const x3 = cx + outerR * Math.cos(endAngle);
    const y3 = cy + outerR * Math.sin(endAngle);
    const x4 = cx + innerR * Math.cos(endAngle);
    const y4 = cy + innerR * Math.sin(endAngle);
    const nightHour = hour < 6 || hour >= 22;
    const eveningHour = hour >= 18 && hour < 22;
    const color = nightHour ? '#6eb5ff' : eveningHour ? '#e8c87a' : 'rgba(255,255,255,0.35)';
    return { path: `M${x1},${y1} L${x2},${y2} A${outerR},${outerR} 0 0,1 ${x3},${y3} L${x4},${y4} A${innerR},${innerR} 0 0,0 ${x1},${y1}Z`, color, hour, count, outerR };
  });

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const formatHour = (h) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          {[40, 60, 80, 100].map(r => (
            <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
          ))}
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.path}
              fill={hovered === i ? 'rgba(232,200,122,0.9)' : seg.color}
              opacity={hovered === null ? 0.85 : hovered === i ? 1 : 0.4}
              style={{ transition: `all 0.8s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.012}s`, cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {[0, 6, 12, 18].map(h => {
            const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
            const r = 108;
            return (
              <text key={h} x={cx + r * Math.cos(angle)} y={cy + r * Math.sin(angle)}
                textAnchor="middle" dominantBaseline="middle"
                fill="rgba(240,236,228,0.3)" fontSize={9} fontFamily="monospace">
                {h === 0 ? '12a' : h === 6 ? '6a' : h === 12 ? '12p' : '6p'}
              </text>
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {hovered !== null ? (
            <>
              <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.5)', textAlign: 'center' }}>{formatHour(hovered)}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e8c87a' }}>{hourCounts[hovered]}</div>
              <div style={{ fontSize: 10, color: 'rgba(240,236,228,0.35)' }}>streams</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, color: 'rgba(240,236,228,0.35)', textAlign: 'center' }}>peak</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#6eb5ff', textAlign: 'center' }}>{formatHour(peakHour)}</div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'rgba(240,236,228,0.4)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#6eb5ff' }} />Night (10p–6a)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#e8c87a' }} />Evening</span>
      </div>
    </div>
  );
};

// ─── MONTHLY ACTIVITY CHART ───────────────────────────────────────────────────

const MonthlyChart = ({ monthlyData }) => {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(null);
  const maxHours = Math.max(...monthlyData.map(d => d.hours), 0.1);
  const chartH = 100;

  return (
    <div ref={ref} style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: Math.max(monthlyData.length * 36, 400), paddingBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: chartH + 30 }}>
          {monthlyData.map((d, i) => {
            const h = inView ? (d.hours / maxHours) * chartH : 0;
            const isHov = hovered === i;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'default', minWidth: 28 }}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                {isHov && (
                  <div style={{ fontSize: 9, color: '#e8c87a', textAlign: 'center', marginBottom: 2, whiteSpace: 'nowrap' }}>
                    {d.hours.toFixed(1)}h
                  </div>
                )}
                <div style={{
                  width: '100%', height: isHov ? h + 4 : h,
                  background: d.hours === maxHours ? '#e8c87a' : isHov ? '#6eb5ff' : 'rgba(255,255,255,0.2)',
                  borderRadius: '2px 2px 0 0', marginTop: 'auto',
                  transition: `height 0.8s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.015}s, background 0.2s`,
                  boxShadow: isHov ? '0 0 12px rgba(110,181,255,0.4)' : d.hours === maxHours ? '0 0 12px rgba(232,200,122,0.4)' : 'none',
                }} />
                <div style={{ fontSize: 8, color: 'rgba(240,236,228,0.3)', marginTop: 4, writingMode: 'vertical-rl', textOrientation: 'mixed', height: 26 }}>
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── DAY-OF-WEEK HEATMAP ─────────────────────────────────────────────────────

const DayHeatmap = ({ dayCounts }) => {
  const [ref, inView] = useInView();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxCount = Math.max(...dayCounts, 1);
  return (
    <div ref={ref} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
      {days.map((d, i) => {
        const intensity = dayCounts[i] / maxCount;
        const isBest = dayCounts[i] === Math.max(...dayCounts);
        return (
          <div key={i} title={`${dayCounts[i]} streams`} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'default'
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 4,
              background: inView ? (isBest ? `rgba(232,200,122,${0.2 + intensity * 0.8})` : `rgba(110,181,255,${0.05 + intensity * 0.7})`) : 'rgba(255,255,255,0.03)',
              border: isBest ? '1px solid rgba(232,200,122,0.5)' : '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: isBest ? '#e8c87a' : `rgba(240,236,228,${0.3 + intensity * 0.7})`,
              transition: `all 0.6s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.08}s`,
              boxShadow: isBest ? '0 0 16px rgba(232,200,122,0.2)' : 'none',
            }}>
              {dayCounts[i]}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(240,236,228,0.4)' }}>{d}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── DEFICIT TIMELINE ────────────────────────────────────────────────────────

const DeficitChart = ({ deficitData }) => {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(null);
  if (!deficitData.length) return <div style={{ color: 'rgba(240,236,228,0.3)', fontSize: 13 }}>No deficit data available.</div>;

  const maxAbs = Math.max(...deficitData.map(d => Math.abs(d.deficit)), 60);
  const chartH = 80;

  return (
    <div ref={ref} style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: Math.max(deficitData.length * 10, 400), paddingBottom: 4 }}>
        <div style={{ position: 'relative', height: chartH * 2 + 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 2, width: '100%', zIndex: 1 }}>
            {deficitData.map((d, i) => {
              const h = inView ? Math.min((Math.abs(d.deficit) / maxAbs) * chartH, chartH) : 0;
              const lost = d.deficit > 0;
              const isHov = hovered === i;
              return (
                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minWidth: 6 }}
                  onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                  {lost ? (
                    <>
                      <div style={{ width: '100%', height: isHov ? h + 3 : h, background: isHov ? '#ff6b6b' : 'rgba(255,100,100,0.6)', borderRadius: '2px 2px 0 0', transition: `height 0.6s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.005}s`, marginTop: 'auto', marginBottom: 0 }} />
                      <div style={{ height: chartH, width: '100%' }} />
                    </>
                  ) : (
                    <>
                      <div style={{ height: chartH, width: '100%' }} />
                      <div style={{ width: '100%', height: isHov ? h + 3 : h, background: isHov ? '#3ddc84' : 'rgba(61,220,132,0.6)', borderRadius: '0 0 2px 2px', transition: `height 0.6s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.005}s`, marginBottom: 'auto', marginTop: 0 }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {hovered !== null && deficitData[hovered] && (
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: deficitData[hovered].deficit > 0 ? '#ff6b6b' : '#3ddc84' }}>
            {deficitData[hovered].gameName} — {deficitData[hovered].deficit > 0 ? `${formatDuration(deficitData[hovered].deficit)} lost` : `${formatDuration(-deficitData[hovered].deficit)} gained`}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12, fontSize: 10, color: 'rgba(240,236,228,0.4)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, background: 'rgba(255,100,100,0.7)', display: 'inline-block', borderRadius: 1 }} /> Time lost (VOD cut short)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, background: 'rgba(61,220,132,0.7)', display: 'inline-block', borderRadius: 1 }} /> Time gained (VOD extended)</span>
        </div>
      </div>
    </div>
  );
};

// ─── TOP GAMES LIST ───────────────────────────────────────────────────────────

const TopGamesList = ({ items, valueKey, formatVal, color = '#e8c87a', maxItems = 8 }) => {
  const [ref, inView] = useInView(0.1);
  const maxVal = Math.max(...items.map(i => i[valueKey]), 1);
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.slice(0, maxItems).map((item, i) => (
        <div key={item.gameId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 20, textAlign: 'right', fontSize: 11, color: i === 0 ? '#e8c87a' : 'rgba(240,236,228,0.3)', fontWeight: i === 0 ? 700 : 400, flexShrink: 0 }}>
            {i + 1}
          </div>
          {item.cover && (
            <img src={getLowResUrl(item.cover, false)} alt="" style={{ width: 32, height: 18, objectFit: 'cover', borderRadius: 1, flexShrink: 0, opacity: 0.8 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'rgba(240,236,228,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{item.gameName}</span>
              <span style={{ fontSize: 11, color, fontWeight: 600, flexShrink: 0 }}>{formatVal(item[valueKey])}</span>
            </div>
            <HBar value={item[valueKey]} max={maxVal} color={i === 0 ? color : 'rgba(255,255,255,0.25)'} delay={i * 0.06} inView={inView} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── DONUT CHART ─────────────────────────────────────────────────────────────

const DonutChart = ({ segments }) => {
  const [ref, inView] = useInView(0.2);
  const [hovered, setHovered] = useState(null);
  const size = 140, cx = size / 2, cy = size / 2, r = 52, stroke = 22;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let offset = -Math.PI / 2;

  const arcs = segments.map((seg, i) => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const startAngle = offset;
    const endAngle = offset + (inView ? angle : 0);
    offset += angle;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...seg, path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`, startAngle, endAngle, i };
  });

  const hovSeg = hovered !== null ? segments[hovered] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
          {arcs.map((arc, i) => (
            <path key={i} d={arc.path}
              fill="none" stroke={arc.color}
              strokeWidth={hovered === i ? stroke + 4 : stroke}
              strokeLinecap="butt"
              style={{ transition: `stroke-width 0.2s, d 1s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.1}s`, cursor: 'pointer', opacity: hovered === null ? 1 : hovered === i ? 1 : 0.4 }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {hovSeg ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, color: hovSeg.color }}>{hovSeg.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(240,236,228,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{hovSeg.label}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f0ece4' }}>{total}</div>
              <div style={{ fontSize: 9, color: 'rgba(240,236,228,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>games</div>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default', opacity: hovered === null || hovered === i ? 1 : 0.4, transition: 'opacity 0.2s' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(240,236,228,0.7)' }}>{seg.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: seg.color }}>{seg.value}</span>
            <span style={{ fontSize: 10, color: 'rgba(240,236,228,0.35)' }}>({Math.round(seg.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── STREAK CALENDAR ─────────────────────────────────────────────────────────

const StreakCalendar = ({ timestamps }) => {
  const [ref, inView] = useInView(0.1);
  const dateMap = useMemo(() => {
    const map = {};
    timestamps.forEach(ts => {
      const d = ts.date;
      if (!d || d < new Date(2000, 0)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [timestamps]);

  const weeks = useMemo(() => {
    const allDates = Object.keys(dateMap).sort();
    if (!allDates.length) return [];
    const firstDate = new Date(allDates[0]);
    const lastDate = new Date(allDates[allDates.length - 1]);
    const start = new Date(firstDate);
    start.setDate(start.getDate() - start.getDay());
    const result = [];
    let current = new Date(start);
    while (current <= lastDate) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const count = dateMap[key] || 0;
        week.push({ date: new Date(current), count, key });
        current.setDate(current.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  }, [dateMap]);

  const maxCount = Math.max(...Object.values(dateMap), 1);
  const last26 = weeks.slice(-26);

  return (
    <div ref={ref} style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', gap: 3, minWidth: last26.length * 13 }}>
        {last26.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((day, di) => {
              const intensity = day.count / maxCount;
              const hasStream = day.count > 0;
              return (
                <div key={di}
                  title={hasStream ? `${day.date.toDateString()}: ${day.count} stream(s)` : day.date.toDateString()}
                  style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: inView && hasStream
                      ? `rgba(232,200,122,${0.15 + intensity * 0.85})`
                      : 'rgba(255,255,255,0.04)',
                    border: hasStream && day.count === maxCount ? '1px solid rgba(232,200,122,0.6)' : '1px solid transparent',
                    transition: `background 0.4s ${(wi * 7 + di) * 0.003}s`,
                    cursor: hasStream ? 'default' : 'default',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', fontSize: 9, color: 'rgba(240,236,228,0.3)' }}>
        <span>Less</span>
        {[0.1, 0.3, 0.55, 0.75, 1].map((o, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(232,200,122,${o * 0.85 + 0.1})` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

// ─── SESSION LENGTH SCATTER ───────────────────────────────────────────────────

const SessionScatter = ({ timestamps }) => {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(null);
  const valid = timestamps.filter(t => t.duration > 0 && t.date > new Date(2000, 0));
  if (!valid.length) return null;

  const sortedByDate = [...valid].sort((a, b) => a.date - b.date);
  const maxDur = Math.max(...valid.map(t => t.duration));
  const width = 500, height = 120;
  const firstDate = sortedByDate[0].date.getTime();
  const lastDate = sortedByDate[sortedByDate.length - 1].date.getTime();
  const dateRange = lastDate - firstDate || 1;

  return (
    <div ref={ref} style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', minWidth: 320 }}>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={0} y1={height * (1 - f)} x2={width} y2={height * (1 - f)}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        ))}
        {sortedByDate.map((t, i) => {
          const x = ((t.date.getTime() - firstDate) / dateRange) * (width - 20) + 10;
          const y = height - (t.duration / maxDur) * (height - 10) - 5;
          const isHov = hovered === i;
          return (
            <g key={i}>
              <circle cx={x} cy={inView ? y : height / 2} r={isHov ? 5 : 3}
                fill={isHov ? '#e8c87a' : 'rgba(110,181,255,0.6)'}
                style={{ transition: `cy 0.6s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.004}s, r 0.15s, fill 0.15s`, cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              />
              {isHov && (
                <text x={Math.min(x, width - 80)} y={y - 10} fill="#e8c87a" fontSize={9} fontFamily="monospace">
                  {t.gameName.slice(0, 18)} · {formatDuration(t.duration)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(240,236,228,0.25)', marginTop: 2 }}>
        <span>{sortedByDate[0]?.date.toLocaleDateString()}</span>
        <span>Session length over time</span>
        <span>{sortedByDate[sortedByDate.length - 1]?.date.toLocaleDateString()}</span>
      </div>
    </div>
  );
};

// ─── FACT CARD ────────────────────────────────────────────────────────────────

const FactCard = ({ emoji, label, value, sub, accent = '#e8c87a', cover }) => {
  const [ref, inView] = useInView(0.2);
  return (
    <div ref={ref} style={{
      position: 'relative', overflow: 'hidden', borderRadius: 2,
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(0,0,0,0.45)', padding: 18,
      transition: 'transform 0.3s, border-color 0.3s',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(12px)',
      transitionProperty: 'opacity, transform',
      transitionDuration: '0.5s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}40`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = ''; }}
    >
      {cover && <img src={getLowResUrl(cover, false)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12 }} />}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 18, marginBottom: 6 }}>{emoji}</div>
        <div style={{ fontSize: 10, color: 'rgba(240,236,228,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: accent, lineHeight: 1.2, marginBottom: 3 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.5)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: '100%', background: accent, opacity: 0.6 }} />
    </div>
  );
};

// ─── MAIN INSIGHTS COMPONENT ─────────────────────────────────────────────────

export default function Insights({ streamData, systemFonts, layoutPrefs }) {
  // ── Process all data ──────────────────────────────────────────────────────

  const allTs = useMemo(() => getAllTimestamps(streamData), [streamData]);
  const allGames = useMemo(() => getAllGames(streamData), [streamData]);

  // Summary numbers
  const totalStreams = allTs.length;
  const totalGames = allGames.length;
  const totalSeconds = allTs.reduce((a, t) => a + t.duration, 0);
  const totalHours = totalSeconds / 3600;

  // Longest & shortest streams
  const withDuration = allTs.filter(t => t.duration > 60);
  const longestTs = withDuration.reduce((a, t) => t.duration > (a?.duration || 0) ? t : a, null);
  const shortestTs = withDuration.reduce((a, t) => t.duration < (a?.duration || Infinity) ? t : a, null);
  const avgDuration = withDuration.length ? withDuration.reduce((a, t) => a + t.duration, 0) / withDuration.length : 0;

  // Most active day (by date)
  const dayMap = {};
  allTs.forEach(t => {
    const key = t.date.toDateString();
    if (!dayMap[key]) dayMap[key] = { date: t.date, count: 0, seconds: 0, games: new Set() };
    dayMap[key].count++;
    dayMap[key].seconds += t.duration;
    dayMap[key].games.add(t.gameName);
  });
  const activeDays = Object.values(dayMap).sort((a, b) => b.count - a.count);
  const busiestDay = activeDays[0];
  const marathonDay = Object.values(dayMap).sort((a, b) => b.seconds - a.seconds)[0];

  // Streak calculation
  const streamDays = [...new Set(allTs.map(t => {
    const d = t.date;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }))].sort((a, b) => a - b);

  let maxStreak = 0, curStreak = 0, streakStart = null, bestStreakStart = null;
  for (let i = 0; i < streamDays.length; i++) {
    if (i === 0 || streamDays[i] - streamDays[i - 1] === 86400000) {
      curStreak++;
      if (curStreak === 1) streakStart = new Date(streamDays[i]);
    } else { curStreak = 1; streakStart = new Date(streamDays[i]); }
    if (curStreak > maxStreak) { maxStreak = curStreak; bestStreakStart = streakStart; }
  }

  // Hour distribution
  const hourCounts = Array(24).fill(0);
  allTs.forEach(t => {
    const h = t.date.getHours();
    hourCounts[h]++;
  });

  // Day of week
  const dayCounts = Array(7).fill(0);
  allTs.forEach(t => dayCounts[t.date.getDay()]++);

  // Monthly data
  const monthMap = {};
  allTs.forEach(t => {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) monthMap[key] = { key, hours: 0, count: 0 };
    monthMap[key].hours += t.duration / 3600;
    monthMap[key].count++;
  });
  const monthlyData = Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key)).map(m => ({
    ...m,
    label: m.key.replace(/(\d{4})-(\d{2})/, (_, y, mo) => {
      const mn = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      return `${mn[parseInt(mo) - 1]}'${y.slice(2)}`;
    })
  }));
  const peakMonth = monthlyData.reduce((a, m) => m.hours > (a?.hours || 0) ? m : a, null);

  // Game rankings
  const gamesByHours = [...allGames].sort((a, b) => b.totalDuration - a.totalDuration);
  const gamesByStreams = [...allGames].sort((a, b) => b.totalStreams - a.totalStreams);

  // Most dedicated run (single cycle)
  let mostDedicatedRun = null, mostDedicatedSecs = 0;
  allGames.forEach(g => {
    Object.entries(g.cycles || {}).forEach(([cId, cycle]) => {
      const secs = (cycle.timestamps || []).reduce((a, t) => a + (t.duration || 0), 0);
      if (secs > mostDedicatedSecs) {
        mostDedicatedSecs = secs;
        mostDedicatedRun = { gameName: g.gameName, cycleName: cycle.displayName || cId, secs, cover: g.cover };
      }
    });
  });

  // Completion stats
  const completedGames = allGames.filter(g => g.label === 'Completed');
  const ongoingGames = allGames.filter(g => g.label === 'Ongoing');
  const abandonedGames = allGames.filter(g => g.label === 'Abandoned');
  const fastestCompletion = [...completedGames].sort((a, b) => a.totalDuration - b.totalDuration)[0];

  // Deficit data
  const deficitData = allTs
    .filter(t => t.deficit !== null && t.deficit !== undefined)
    .map(t => ({ gameName: t.gameName, deficit: t.deficit, duration: t.duration }));

  const totalDeficitSecs = deficitData.reduce((a, d) => a + d.deficit, 0);
  const totalLostSecs = deficitData.filter(d => d.deficit > 0).reduce((a, d) => a + d.deficit, 0);
  const totalGainedSecs = deficitData.filter(d => d.deficit < 0).reduce((a, d) => a + Math.abs(d.deficit), 0);

  // Night owl vs early bird
  const nightStreams = allTs.filter(t => { const h = t.date.getHours(); return h >= 22 || h < 6; }).length;
  const dayStreams = allTs.filter(t => { const h = t.date.getHours(); return h >= 6 && h < 18; }).length;
  const eveningStreams = allTs.filter(t => { const h = t.date.getHours(); return h >= 18 && h < 22; }).length;
  const maxTimeSegment = Math.max(nightStreams, dayStreams, eveningStreams);
  const timePersonality = maxTimeSegment === nightStreams ? 'Night Owl 🦉' : maxTimeSegment === eveningStreams ? 'Evening Player 🌆' : 'Day Player ☀️';

  // Games with most sessions per game
  const mostAbandoned = [...abandonedGames].sort((a, b) => b.totalStreams - a.totalStreams)[0];

  // Unique games per month maximum
  const monthlyGames = {};
  allTs.forEach(t => {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyGames[key]) monthlyGames[key] = new Set();
    monthlyGames[key].add(t.gameId);
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!totalStreams) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(240,236,228,0.4)', gap: 12 }}>
        <div style={{ fontSize: 40 }}>📊</div>
        <div style={{ fontSize: 16 }}>No stream data to analyze yet.</div>
      </div>
    );
  }

  // ── Container style ───────────────────────────────────────────────────────

  const containerStyle = {
    paddingLeft: `clamp(16px, ${layoutPrefs?.containerPaddingX || 77}px, 5vw)`,
    paddingRight: `clamp(16px, ${layoutPrefs?.containerPaddingX || 77}px, 5vw)`,
    paddingTop: 32,
    paddingBottom: 60,
    fontFamily: '"Inter", system-ui, sans-serif',
    color: '#f0ece4',
    maxWidth: 1400,
    margin: '0 auto',
  };

  const sectionStyle = {
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 4,
    padding: 24,
    marginBottom: 20,
  };

  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 };
  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 };
  const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 };

  return (
    <div style={{ height: '100%', overflowY: 'auto' }} className="custom-scrollbar">
      <div style={containerStyle}>

        {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f0ece4', letterSpacing: '-0.02em', margin: 0 }}>
              Stream Insights
            </h1>
            <span style={{ fontSize: 12, color: 'rgba(240,236,228,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {totalStreams} sessions · {totalGames} games
            </span>
          </div>
          <div style={{ height: 2, background: 'linear-gradient(to right, #e8c87a, rgba(232,200,122,0.1), transparent)', marginTop: 12, borderRadius: 2 }} />
        </div>

        {/* ── HERO STATS ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <HeroCard label="Total Streams" value={totalStreams.toLocaleString()} accent="#e8c87a" />
          <HeroCard label="Total Playtime" value={`${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m`} accent="#6eb5ff" cover={gamesByHours[0]?.cover} />
          <HeroCard label="Games Tracked" value={totalGames} accent="#3ddc84" />
          <HeroCard label="Avg. Session" value={formatDuration(Math.round(avgDuration))} accent="#c27aff" />
          <HeroCard label="Days Active" value={streamDays.length.toLocaleString()} accent="#ff8c69" />
          <HeroCard label="Longest Streak" value={`${maxStreak} days`} sub={bestStreakStart ? `from ${bestStreakStart.toLocaleDateString()}` : ''} accent="#e8c87a" />
        </div>

        {/* ── PERSONALITY + COMPLETION ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>

          {/* Personality */}
          <div style={sectionStyle}>
            <SectionHeader icon="🎮" title="Your Playstyle" subtitle="Time & behavioral patterns" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 3, textAlign: 'center', border: '1px solid rgba(232,200,122,0.15)' }}>
                <div style={{ fontSize: 28 }}>{timePersonality.split(' ').slice(-1)[0]}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e8c87a', marginTop: 4 }}>{timePersonality.split(' ').slice(0, -1).join(' ')}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.4)', marginTop: 4 }}>
                  {nightStreams} night · {eveningStreams} evening · {dayStreams} day sessions
                </div>
              </div>
              <div style={grid3}>
                <FactCard emoji="🔥" label="Busiest Day" value={busiestDay?.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })} sub={`${busiestDay?.count} streams`} accent="#ff8c69" />
                <FactCard emoji="⏱️" label="Marathon Day" value={marathonDay ? formatDuration(marathonDay.seconds) : '—'} sub={marathonDay?.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })} accent="#6eb5ff" />
                <FactCard emoji="📅" label="Peak Month" value={peakMonth?.key.replace(/(\d{4})-(\d{2})/, (_, y, m) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return `${months[parseInt(m) - 1]} '${y.slice(2)}`;
                })} sub={`${peakMonth?.count} sessions · ${peakMonth?.hours.toFixed(1)}h`} accent="#e8c87a" />
              </div>
            </div>
          </div>

          {/* Completion Donut */}
          <div style={sectionStyle}>
            <SectionHeader icon="🏆" title="Game Completion" subtitle="How your library breaks down" />
            <DonutChart segments={[
              { label: 'Completed', value: completedGames.length, color: '#e8c87a' },
              { label: 'Ongoing', value: ongoingGames.length, color: '#3ddc84' },
              { label: 'Abandoned', value: abandonedGames.length, color: '#ff5c5c' },
            ]} />
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {fastestCompletion && (
                <FactCard emoji="⚡" label="Fastest Clear" value={fastestCompletion.gameName} sub={formatDuration(fastestCompletion.totalDuration)} accent="#e8c87a" cover={fastestCompletion.cover} />
              )}
              {mostAbandoned && (
                <FactCard emoji="💀" label="Most Abandoned" value={mostAbandoned.gameName} sub={`After ${mostAbandoned.totalStreams} streams`} accent="#ff5c5c" cover={mostAbandoned.cover} />
              )}
            </div>
          </div>
        </div>

        {/* ── SESSIONS: LONGEST / SHORTEST / RECORDS ───────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="⏳" title="Session Records" subtitle="Individual stream extremes" />
          <div style={grid3}>
            <FactCard emoji="🥇" label="Longest Stream"
              value={longestTs ? formatDuration(longestTs.duration) : '—'}
              sub={longestTs ? longestTs.gameName : ''}
              accent="#e8c87a" cover={longestTs ? streamData[longestTs.gameId]?.cover_image : null}
            />
            <FactCard emoji="⚡" label="Shortest Stream"
              value={shortestTs ? formatDuration(shortestTs.duration) : '—'}
              sub={shortestTs ? shortestTs.gameName : ''}
              accent="#6eb5ff" cover={shortestTs ? streamData[shortestTs.gameId]?.cover_image : null}
            />
            <FactCard emoji="⌚" label="Average Session"
              value={formatDuration(Math.round(avgDuration))}
              sub={`across ${withDuration.length} timed sessions`}
              accent="#3ddc84"
            />
            <FactCard emoji="🎯" label="Most Dedicated Run"
              value={mostDedicatedRun?.gameName || '—'}
              sub={mostDedicatedRun ? `${mostDedicatedRun.cycleName} · ${formatDuration(mostDedicatedSecs)}` : ''}
              accent="#c27aff" cover={mostDedicatedRun?.cover}
            />
            <FactCard emoji="🗓️" label="Most Active Day"
              value={busiestDay ? `${busiestDay.count} streams` : '—'}
              sub={busiestDay?.date.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
              accent="#ff8c69"
            />
            <FactCard emoji="🔁" label="Longest Streak"
              value={`${maxStreak} consecutive days`}
              sub={bestStreakStart ? `starting ${bestStreakStart.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
              accent="#e8c87a"
            />
          </div>
        </div>

        {/* ── SESSION LENGTH SCATTER ────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="📈" title="Session Length Over Time" subtitle="Every stream plotted · hover to inspect" />
          <SessionScatter timestamps={allTs} />
        </div>

        {/* ── ACTIVITY CALENDAR ─────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="📆" title="Stream Calendar" subtitle="Last 6 months of activity" />
          <StreakCalendar timestamps={allTs} />
        </div>

        {/* ── HOURLY + WEEKLY ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
          <div style={sectionStyle}>
            <SectionHeader icon="🕐" title="When Do You Play?" subtitle="Streams by hour of day" />
            <HourPolarChart hourCounts={hourCounts} />
          </div>
          <div style={sectionStyle}>
            <SectionHeader icon="📅" title="Day of the Week" subtitle="Which day you stream most" />
            <DayHeatmap dayCounts={dayCounts} />
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Breakdown</div>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(240,236,228,0.6)', padding: '3px 0' }}>
                  <span>{day}</span>
                  <span style={{ color: dayCounts[i] === Math.max(...dayCounts) ? '#e8c87a' : 'rgba(240,236,228,0.6)', fontWeight: dayCounts[i] === Math.max(...dayCounts) ? 700 : 400 }}>
                    {dayCounts[i]} streams ({totalStreams > 0 ? Math.round(dayCounts[i] / totalStreams * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MONTHLY ACTIVITY ──────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="📊" title="Monthly Activity" subtitle="Total hours streamed per month · hover bars" />
          <MonthlyChart monthlyData={monthlyData} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginTop: 16 }}>
            <FactCard emoji="📈" label="Most Active Month"
              value={peakMonth?.key.replace(/(\d{4})-(\d{2})/, (_, y, m) => {
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                return months[parseInt(m) - 1] + ' ' + y;
              })}
              sub={`${peakMonth?.hours.toFixed(1)}h · ${peakMonth?.count} streams`}
              accent="#e8c87a"
            />
            <FactCard emoji="📉" label="Quietest Month"
              value={(() => {
                const quietest = monthlyData.reduce((a, m) => m.hours < (a?.hours ?? Infinity) ? m : a, null);
                if (!quietest) return '—';
                const [y, mo] = quietest.key.split('-');
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${months[parseInt(mo) - 1]} ${y}`;
              })()}
              sub={`${monthlyData.reduce((a, m) => m.hours < (a?.hours ?? Infinity) ? m : a, null)?.hours.toFixed(1)}h`}
              accent="#ff5c5c"
            />
            <FactCard emoji="📊" label="Monthly Average"
              value={monthlyData.length ? formatDuration(Math.round((totalSeconds / monthlyData.length))) : '—'}
              sub={`over ${monthlyData.length} active months`}
              accent="#6eb5ff"
            />
          </div>
        </div>

        {/* ── TOP GAMES: HOURS ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
          <div style={sectionStyle}>
            <SectionHeader icon="⏰" title="Most Played by Hours" subtitle="Total VOD duration" />
            <TopGamesList items={gamesByHours} valueKey="totalDuration" formatVal={formatDuration} color="#e8c87a" />
          </div>
          <div style={sectionStyle}>
            <SectionHeader icon="🎮" title="Most Played by Sessions" subtitle="Raw stream count" />
            <TopGamesList items={gamesByStreams} valueKey="totalStreams" formatVal={(v) => `${v} streams`} color="#6eb5ff" />
          </div>
        </div>

        {/* ── VOD DEFICIT ───────────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="⚖️" title="VOD Time Deficit" subtitle="Difference between stream uptime and YouTube VOD duration · hover to inspect" />
          {deficitData.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
                <FactCard emoji="⏱️" label="Total Sessions Analyzed" value={deficitData.length} sub={`of ${totalStreams} total`} accent="#6eb5ff" />
                <FactCard emoji="📉" label="Total Time Lost" value={formatDuration(totalLostSecs)} sub="VOD shorter than uptime" accent="#ff5c5c" />
                <FactCard emoji="📈" label="Total Time Gained" value={formatDuration(totalGainedSecs)} sub="VOD longer than uptime" accent="#3ddc84" />
                <FactCard emoji="⚖️" label="Net Difference"
                  value={totalDeficitSecs > 0 ? `-${formatDuration(totalDeficitSecs)}` : `+${formatDuration(-totalDeficitSecs)}`}
                  sub={totalDeficitSecs > 0 ? 'Lost overall' : 'Gained overall'}
                  accent={totalDeficitSecs > 0 ? '#ff5c5c' : '#3ddc84'}
                />
              </div>
              <DeficitChart deficitData={deficitData} />
            </>
          ) : (
            <div style={{ color: 'rgba(240,236,228,0.35)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              No start/end time data available. Sync your playlists to populate this chart.
            </div>
          )}
        </div>

        {/* ── ALL GAMES RANKED TABLE ────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="📋" title="Full Game Rankings" subtitle="Every game sorted by total playtime" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['#', 'Game', 'Streams', 'Total Time', 'Avg. Session', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(240,236,228,0.35)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gamesByHours.map((g, i) => {
                  const avgSec = g.totalStreams > 0 ? g.totalDuration / g.totalStreams : 0;
                  const labelColor = g.label === 'Completed' ? '#e8c87a' : g.label === 'Ongoing' ? '#3ddc84' : '#ff5c5c';
                  return (
                    <tr key={g.gameId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '10px 12px', color: i < 3 ? '#e8c87a' : 'rgba(240,236,228,0.3)', fontWeight: i < 3 ? 700 : 400 }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {g.cover && <img src={getLowResUrl(g.cover, false)} alt="" style={{ width: 28, height: 16, objectFit: 'cover', borderRadius: 1, opacity: 0.7, flexShrink: 0 }} />}
                          <span style={{ color: 'rgba(240,236,228,0.85)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{g.gameName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,236,228,0.6)', fontVariantNumeric: 'tabular-nums' }}>{g.totalStreams}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,236,228,0.8)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatDuration(g.totalDuration) || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,236,228,0.5)', fontVariantNumeric: 'tabular-nums' }}>{avgSec > 0 ? formatDuration(Math.round(avgSec)) : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: `${labelColor}18`, color: labelColor, border: `1px solid ${labelColor}35`, borderRadius: 3, padding: '2px 7px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {g.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', color: 'rgba(240,236,228,0.2)', fontSize: 11, marginTop: 16, letterSpacing: '0.06em' }}>
          Analyzed {totalStreams} streams across {totalGames} games · {formatDuration(totalSeconds)} of footage
        </div>

      </div>
    </div>
  );
}