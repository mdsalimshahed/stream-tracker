// src/components/insights/Charts.jsx
import React, { useMemo, useState } from 'react';
import { useInView } from './hooks';
import { formatDuration, getLowResUrl } from '../../utils/helpers';
import { HBar } from './UIComponents';

export const HourPolarChart = ({ hourCounts }) => {
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

export const MonthlyChart = ({ monthlyData }) => {
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

export const DayHeatmap = ({ dayCounts }) => {
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

export const DeficitChart = ({ deficitData }) => {
  const [ref, inView] = useInView(0.1);
  const [hovered, setHovered] = useState(null);

  if (!deficitData.length) {
    return <div style={{ color: 'rgba(240,236,228,0.3)', fontSize: 13 }}>No deficit data available.</div>;
  }

  const maxAbs = Math.max(...deficitData.map(d => Math.abs(d.deficit)), 60);
  const width = 800; // Reference width for SVG viewBox
  const height = 160;

  return (
    <div ref={ref} style={{ width: '100%', overflow: 'hidden' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
        {/* Center line (0 deficit) */}
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 4" />
        
        {/* Background guide lines */}
        <line x1={0} y1={20} x2={width} y2={20} stroke="rgba(255,100,100,0.1)" strokeWidth={1} />
        <line x1={0} y1={height - 20} x2={width} y2={height - 20} stroke="rgba(61,220,132,0.1)" strokeWidth={1} />

        {deficitData.map((d, i) => {
          // Spread points evenly across the width
          const x = deficitData.length > 1 
            ? (i / (deficitData.length - 1)) * (width - 20) + 10 
            : width / 2;
          
          // Deficit > 0 goes UP, Deficit < 0 goes DOWN
          const yOffset = inView ? (d.deficit / maxAbs) * (height / 2 - 20) : 0;
          const y = height / 2 - yOffset; 

          const isHov = hovered === i;
          const isLost = d.deficit > 0;
          const color = isLost ? '#ff6b6b' : '#3ddc84';

          return (
            <g key={i}>
              {/* Invisible larger hover target for better UX */}
              <circle 
                cx={x} 
                cy={y} 
                r={15} 
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)} 
                onMouseLeave={() => setHovered(null)}
              />
              <circle 
                cx={x} 
                cy={y} 
                r={isHov ? 6 : 3}
                fill={color}
                opacity={hovered === null || isHov ? 1 : 0.3}
                style={{ 
                  transition: `all 0.6s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.005}s, r 0.15s, fill 0.15s, opacity 0.2s`, 
                  pointerEvents: 'none'
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip / Hover Info */}
      <div style={{ minHeight: '20px', textAlign: 'center', marginTop: 12, fontSize: 13, color: hovered !== null && deficitData[hovered].deficit > 0 ? '#ff6b6b' : '#3ddc84' }}>
        {hovered !== null && deficitData[hovered] ? (
          <span style={{ fontWeight: 600 }}>
            {deficitData[hovered].gameName} — {deficitData[hovered].deficit > 0 ? `${formatDuration(deficitData[hovered].deficit)} lost` : `${formatDuration(-deficitData[hovered].deficit)} gained`}
          </span>
        ) : (
          <span style={{ color: 'transparent' }}>Hover over a point to see details</span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12, fontSize: 10, color: 'rgba(240,236,228,0.4)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b6b' }} /> Time lost (VOD cut short)</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3ddc84' }} /> Time gained (VOD extended)</span>
      </div>
    </div>
  );
};

export const TopGamesList = ({ items, valueKey, formatVal, color = '#e8c87a', maxItems = 8 }) => {
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

export const DonutChart = ({ segments }) => {
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
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
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

export const StreakCalendar = ({ timestamps }) => {
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

export const SessionScatter = ({ timestamps }) => {
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