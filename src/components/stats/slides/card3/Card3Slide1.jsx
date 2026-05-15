import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

const Slide6Tooltip = ({ active, payload, selectedNode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (selectedNode && data.name !== selectedNode) return null;
    
    let ringColor = data.status === 'Completed' ? "#f5a623" : data.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c"; 

    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const d = new Date(data.fullDate);
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

const Slide6StaticDot = (props) => {
  const { cx, cy, payload, selectedNode, onSelect } = props;
  if (cx === undefined || cy === undefined) return null;
  
  const clipId = `clip-${payload.name.replace(/[^a-zA-Z0-9]/g, '')}-${cx}-${cy}`;
  let ringColor = payload.status === 'Completed' ? "#f5a623" : payload.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c"; 
  
  const isSelected = selectedNode === payload.name;
  
  const ringRadius = isSelected ? 31 : 12;
  const imgRadius = isSelected ? 27 : 10;
  const imgSize = imgRadius * 2;
  
  return (
    <g 
      style={{ opacity: selectedNode !== null && !isSelected ? 0.2 : 1, transition: 'opacity 0.3s ease', cursor: 'pointer', outline: 'none' }} 
      onClick={(e) => { 
        if (e && e.stopPropagation) e.stopPropagation(); 
        onSelect(isSelected ? null : payload.name); 
      }}
    >
      <circle cx={cx} cy={cy} r={isSelected ? 32 : 16} fill="transparent" /> 
      <circle cx={cx} cy={cy} r={ringRadius} fill={ringColor} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
      <clipPath id={clipId}><circle cx={cx} cy={cy} r={imgRadius} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} /></clipPath>
      <image x={cx - imgRadius} y={cy - imgRadius} width={imgSize} height={imgSize} href={payload.image} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" style={{ transition: 'all 0.3s' }} />
    </g>
  );
};

export default function Card3Slide1({ data }) {
  const { gamesTimeline } = data;
  const [selectedNode, setSelectedNode] = useState(null);
  
  const xTicks = useMemo(() => {
    const ticks = []; let lastMonth = '';
    gamesTimeline?.forEach((g, i) => {
      const parts = g.month.split(' ');
      const formatted = parts.length === 2 ? `${parts[0]} '${parts[1].slice(-2)}` : g.month;
      if (formatted !== lastMonth) { ticks.push(i); lastMonth = formatted; }
    });
    return ticks;
  }, [gamesTimeline]);

  // Calculate dynamic Y-Max rounding up to nearest 50
  const yMax = useMemo(() => {
    let max = 0;
    gamesTimeline?.forEach(g => {
      if (g.hours > max) max = g.hours;
    });
    
    if (max === 0) return 50; 
    return Math.ceil(max / 50) * 50; 
  }, [gamesTimeline]);

  return (
    <div className="slide-container flex flex-col justify-start bg-black/40 pt-4 pb-2 px-4 h-full outline-none" onClick={(e) => {
      if (e.target.tagName?.toLowerCase() === 'circle' || e.target.tagName?.toLowerCase() === 'image') return;
      setSelectedNode(null);
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        .recharts-wrapper * { outline: none !important; }
        .recharts-line-dots, .recharts-area-dots { clip-path: none !important; }
        *:focus { outline: none !important; }
      `}} />
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <AreaChart data={gamesTimeline} margin={{ top: 60, right: 35, left: 10, bottom: 10 }} style={{ overflow: 'visible' }}>
            
            <text 
              x="35%" 
              y={40} 
              textAnchor="middle" 
              fill="rgba(255,255,255,0.5)" 
              fontSize={20} 
              fontWeight="regular" 
              letterSpacing={2} 
              className="uppercase pointer-events-none"
            >
            Timeline
            </text>

            <defs>
              <linearGradient id="slide6GradientFill" x1="0" y1="0" x2="1" y2="0">
                {gamesTimeline?.map((g, i) => {
                  const offset = `${(i / Math.max(1, gamesTimeline.length - 1)) * 100}%`;
                  const color = g.status === 'Completed' ? "#f5a623" : g.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c";
                  return <stop key={`fill-${i}`} offset={offset} stopColor={color} stopOpacity={0.8} />;
                })}
              </linearGradient>
              <linearGradient id="slide6GradientStroke" x1="0" y1="0" x2="1" y2="0">
                {gamesTimeline?.map((g, i) => {
                  const offset = `${(i / Math.max(1, gamesTimeline.length - 1)) * 100}%`;
                  const color = g.status === 'Completed' ? "#f5a623" : g.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c";
                  return <stop key={`stroke-${i}`} offset={offset} stopColor={color} stopOpacity={1} />;
                })}
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="index" ticks={xTicks} stroke="#8a88a8" tickLine={false} axisLine={true} tickMargin={8} dy={0} 
              minTickGap={5} tick={{ fill: '#8a88a8', fontSize: 11 }}
              tickFormatter={(val) => { const g = gamesTimeline[val]; const p = g?.month.split(' '); return p?.length === 2 ? `${p[0]} '${p[1].slice(-2)}` : g?.month; }} 
            />
            <YAxis 
            stroke="#8a88a8" tickLine={false} axisLine={true} tickCount={4} tickFormatter={(v) => v === 0 ? '' : `${Math.round(v)}h`} 
            width={30} tickMargin={5} domain={[0, yMax]} tick={{ angle: -90, textAnchor: 'middle', fill: '#8a88a8', fontSize: 11}}
            />
            <Tooltip content={<Slide6Tooltip selectedNode={selectedNode} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} isAnimationActive={false} />
            <Area 
              type="monotone" dataKey="hours" stroke="url(#slide6GradientStroke)" strokeWidth={3} fill="url(#slide6GradientFill)" 
              isAnimationActive={false} activeDot={false} 
              dot={(props) => <Slide6StaticDot {...props} selectedNode={selectedNode} onSelect={setSelectedNode} />} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}