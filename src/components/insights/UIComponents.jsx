// src/components/insights/UIComponents.jsx
import React from 'react';

export const StatCard = ({ label, value, sub, colorClass }) => (
  <div className={`stat-card ${colorClass}`}>
    <div className="stat-label">{label}</div>
    <div className={`stat-value ${colorClass}`}>{value}</div>
    <div className="stat-sub">{sub}</div>
  </div>
);

export const ChartCard = ({ title, sub, children, height = 240, noPadding = false }) => (
  <div className="chart-card" style={noPadding ? { padding: 0, overflow: 'hidden' } : {}}>
    {title && <div className="chart-title">{title}</div>}
    {sub && <div className="chart-sub">{sub}</div>}
    <div style={{ position: 'relative', width: '100%', height: height ? `${height}px` : 'auto' }}>
      {children}
    </div>
  </div>
);

export const FunCard = ({ emoji, title, value, desc }) => (
  <div className="fun-card" data-emoji={emoji}>
    <div className="fun-title">{title}</div>
    <div className="fun-value">{value}</div>
    <div className="fun-desc">{desc}</div>
  </div>
);

export const HeatmapGrid = ({ allStreams }) => {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hm = Array.from({ length: 7 }, () => Array(24).fill(0));
  allStreams.forEach(s => {
    const d = new Date(s.date);
    let dow = d.getDay() - 1; if (dow < 0) dow = 6;
    hm[dow][d.getHours()]++;
  });
  const max = Math.max(...hm.flat(), 1);

  const flatHm = hm.map(row => Math.max(...row));
  const peakDayIdx = flatHm.indexOf(Math.max(...flatHm));
  const peakHour = hm[peakDayIdx].indexOf(Math.max(...hm[peakDayIdx]));

  return (
    <>
      <div className="heatmap-grid" style={{ marginTop: '0.5rem' }}>
        <div className="hm-row-label"></div>
        {Array.from({ length: 24 }).map((_, h) => <div key={h} className="hm-hour-label">{h}h</div>)}
        {DAYS.map((day, d) => (
          <React.Fragment key={d}>
            <div className="hm-row-label">{day}</div>
            {hm[d].map((v, h) => {
              const ratio = v / max;
              const alpha = (0.08 + ratio * 0.92).toFixed(2);
              const r = Math.round(124 + ratio * 131), g2 = Math.round(108 + ratio * (-28)), b = Math.round(250 + ratio * (-100));
              const bg = v > 0 ? `rgba(${r},${g2},${b},${alpha})` : 'rgba(34,34,58,0.5)';
              return <div key={h} className="hm-cell" style={{ background: bg }} title={`${day} ${h}:00 — ${v} stream${v !== 1 ? 's' : ''}`}></div>
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="annotation">
        Peak: <strong>{DAYS[peakDayIdx]} at {peakHour > -1 ? `${peakHour}h` : 'N/A'}</strong> — your most active streaming slot.
      </div>
    </>
  );
};

export const LifespanViz = ({ gameStats }) => {
  const sorted = [...gameStats].filter(g => g.dates.length > 0).sort((a, b) => a.firstDate - b.firstDate);
  if (!sorted.length) return null;
  const minDate = sorted[0].firstDate;
  const maxDate = Math.max(...sorted.map(g => g.lastDate));
  const totalSpan = maxDate - minDate || 1;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {sorted.map(g => {
        const left = ((g.firstDate - minDate) / totalSpan * 100).toFixed(1);
        const width = Math.max(0.5, ((g.lastDate - g.firstDate) / totalSpan * 100)).toFixed(1);
        const color = g.status === 'Completed' ? '#6cfacc' : g.status === 'Ongoing' ? '#fac86c' : '#f87171';
        const startStr = new Date(g.firstDate).toLocaleDateString('en', { month: 'short', year: 'numeric' });
        const endStr = new Date(g.lastDate).toLocaleDateString('en', { month: 'short', year: 'numeric' });

        return (
          <div key={g.id} className="progress-row" title={`${g.name}: ${startStr} → ${endStr}`}>
            <div className="progress-label">{g.name.substring(0, 22)}</div>
            <div className="progress-bar-wrap">
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <div className="progress-bar-fill" style={{ width: `${width}%`, marginLeft: `${left}%`, background: color, opacity: 0.85, position: 'absolute' }}></div>
              </div>
            </div>
            <div className="progress-val">{startStr}</div>
          </div>
        );
      })}
    </div>
  );
};