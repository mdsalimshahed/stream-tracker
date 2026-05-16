// src/components/stats/slides/card3/Card3Slide1.jsx
import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Label } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

const Slide6Tooltip = ({ active, payload, selectedNode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (selectedNode && data.name !== selectedNode) return null;
    let ringColor = data.status === 'Completed' ? "#f5a623" : data.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c"; 
    const d = new Date(data.fullDate);
    const getOrdinal = (n) => { const s = ["th", "st", "nd", "rd"]; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
    const formattedDate = `${getOrdinal(d.getDate())} ${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;
    return (
      <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none whitespace-nowrap">
        <div className="text-white font-bold mb-1 text-sm">{data.name}</div>
        <div className="text-white/50 mb-2" style={{ fontSize: '10px' }}>Started: {formattedDate}</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ringColor }}></span>
          <span className="font-bold text-[#e8c87a]">{formatFullTime(data.rawSeconds ?? Math.round(data.hours * 3600))}</span>
        </div>
      </div>
    );
  }
  return null;
};

const Slide6StaticDot = ({ cx, cy, payload, selectedNode, onSelect }) => {
  if (cx === undefined || cy === undefined) return null;
  const clipId = `clip-${payload.name.replace(/[^a-zA-Z0-9]/g, '')}-${cx}-${cy}`;
  let ringColor = payload.status === 'Completed' ? "#f5a623" : payload.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c"; 
  const isSelected = selectedNode === payload.name;
  const ringRadius = isSelected ? 31 : 12;
  const imgRadius = isSelected ? 27 : 10;
  
  return (
    <g style={{ opacity: selectedNode !== null && !isSelected ? 0.2 : 1, transition: 'opacity 0.3s ease', cursor: 'pointer', outline: 'none' }} onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); onSelect(isSelected ? null : payload.name); }}>
      <circle cx={cx} cy={cy} r={isSelected ? 32 : 16} fill="transparent" /> 
      <circle cx={cx} cy={cy} r={ringRadius} fill={ringColor} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
      <clipPath id={clipId}><circle cx={cx} cy={cy} r={imgRadius} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} /></clipPath>
      <image x={cx - imgRadius} y={cy - imgRadius} width={imgRadius * 2} height={imgRadius * 2} href={payload.image} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" style={{ transition: 'all 0.3s' }} />
    </g>
  );
};

export default function Card3Slide1({ data }) {
  const { gamesTimeline, timelineXTicks, timelineYMax, timelineYTicks } = data;
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden" onClick={(e) => { if (e.target.tagName?.toLowerCase() === 'circle' || e.target.tagName?.toLowerCase() === 'image') return; setSelectedNode(null); }}>
      <div className="w-full h-full flex-1 outline-none relative">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <AreaChart data={gamesTimeline} margin={{ top: 20, right: 20, left: 10, bottom: 15 }} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="slide6GradientFill" x1="0" y1="0" x2="1" y2="0">
                {gamesTimeline?.map((g, i) => <stop key={`fill-${i}`} offset={`${(i / Math.max(1, gamesTimeline.length - 1)) * 100}%`} stopColor={g.status === 'Completed' ? "#f5a623" : g.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c"} stopOpacity={0.8} />)}
              </linearGradient>
              <linearGradient id="slide6GradientStroke" x1="0" y1="0" x2="1" y2="0">
                {gamesTimeline?.map((g, i) => <stop key={`stroke-${i}`} offset={`${(i / Math.max(1, gamesTimeline.length - 1)) * 100}%`} stopColor={g.status === 'Completed' ? "#f5a623" : g.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c"} stopOpacity={1} />)}
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="index" ticks={timelineXTicks} stroke="#8a88a8" tickLine={false} axisLine={false} tickMargin={10} height={35} minTickGap={5} padding={{ left: 35, right: 35 }} tick={{ fill: '#8a88a8', fontSize: 10 }} tickFormatter={(val) => { const g = gamesTimeline[val]; const p = g?.month.split(' '); return p?.length === 2 ? `${p[0]} '${p[1].slice(-2)}` : g?.month; }}>
              <Label value="Starting Date" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>
            <YAxis stroke="#8a88a8" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} width={45} domain={[0, timelineYMax]} ticks={timelineYTicks} padding={{ top: 35, bottom: 10 }} tick={{ angle: -90, textAnchor: 'middle', dx: -10, fill: '#8a88a8', fontSize: 10}}>
              <Label value="Playtime" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<Slide6Tooltip selectedNode={selectedNode} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} isAnimationActive={false} />
            <Area type="monotone" dataKey="hours" stroke="url(#slide6GradientStroke)" strokeWidth={3} fill="url(#slide6GradientFill)" isAnimationActive={false} activeDot={false} dot={(props) => <Slide6StaticDot {...props} selectedNode={selectedNode} onSelect={setSelectedNode} />} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}