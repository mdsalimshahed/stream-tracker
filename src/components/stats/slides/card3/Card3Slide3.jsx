// src/components/stats/slides/card3/Card3Slide3.jsx
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceDot, Label } from 'recharts';

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hours = data.hours;
    let color = '#ff5c5c'; 
    if (hours > 0 && hours <= data.midThreshold) color = '#f5a623'; 
    if (hours > data.midThreshold) color = '#3ddc84'; 

    const h = Math.floor(data.rawSeconds / 3600);
    const m = Math.floor((data.rawSeconds % 3600) / 60);
    const s = Math.floor(data.rawSeconds % 60);
    
    let timeStr = [];
    if (h > 0) timeStr.push(`${h} hour${h !== 1 ? 's' : ''}`);
    if (m > 0 || h > 0) timeStr.push(`${m} minute${m !== 1 ? 's' : ''}`);
    timeStr.push(`${s} second${s !== 1 ? 's' : ''}`);

    const d = new Date(data.dateMs);
    const fullDate = `${getOrdinal(d.getDate())} ${d.toLocaleDateString('en-US', { month: 'long' })}, ${d.getFullYear()}`;

    return (
      <div className="bg-[#0a0a0a] border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none">
        <div className="font-bold text-white/50 mb-1">{fullDate}</div>
        <div className="flex items-center gap-2 font-bold" style={{ color }}>
          {timeStr.join(' ')}
        </div>
      </div>
    );
  }
  return null;
};

const PermanentMaxTooltip = (props) => {
  const { cx, cy, maxData } = props;
  if (cx === undefined || cy === undefined || !maxData) return null;

  const h = Math.floor(maxData.rawSeconds / 3600);
  const m = Math.floor((maxData.rawSeconds % 3600) / 60);
  const s = Math.floor(maxData.rawSeconds % 60);
  
  let timeStr = [];
  if (h > 0) timeStr.push(`${h} hour${h !== 1 ? 's' : ''}`);
  if (m > 0 || h > 0) timeStr.push(`${m} minute${m !== 1 ? 's' : ''}`);
  timeStr.push(`${s} second${s !== 1 ? 's' : ''}`);

  const d = new Date(maxData.dateMs);
  const fullDate = `${getOrdinal(d.getDate())} ${d.toLocaleDateString('en-US', { month: 'long' })}, ${d.getFullYear()}`;

  let color = '#ff5c5c'; 
  if (maxData.hours > 0 && maxData.hours <= maxData.midThreshold) color = '#f5a623'; 
  if (maxData.hours > maxData.midThreshold) color = '#3ddc84';

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <foreignObject x="-150" y="-100" width="300" height="100" className="overflow-visible pointer-events-none">
        <div className="w-full h-full flex flex-col justify-end items-center pb-[6px]">
          <div className="relative bg-[#0a0a0a] border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl text-center w-max max-w-[280px]">
            <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-[11px] h-[11px] bg-[#0a0a0a] border-b border-r border-white/20 rotate-45 z-0"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="font-bold text-white/50 mb-1">{fullDate}</div>
              <div className="flex items-center gap-2 font-bold" style={{ color }}>
                {timeStr.join(' ')}
              </div>
            </div>
          </div>
        </div>
      </foreignObject>
      <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
    </g>
  );
};

export default function Card3Slide3({ data }) {
  const { dailyStreamHours } = data;

  const processedData = useMemo(() => {
    if (!dailyStreamHours || dailyStreamHours.length === 0) return [];
    const maxHours = Math.max(...dailyStreamHours.map(d => d.hours), 0);
    const midThreshold = maxHours / 2;
    return dailyStreamHours.map(d => ({ ...d, midThreshold }));
  }, [dailyStreamHours]);

  const { yMax, yTicks } = useMemo(() => {
    if (!dailyStreamHours || dailyStreamHours.length === 0) return { yMax: 3, yTicks: [1, 2, 3] };
    const maxHours = Math.max(...dailyStreamHours.map(d => d.hours), 0);
    if (maxHours === 0) return { yMax: 3, yTicks: [1, 2, 3] };
    
    const yM = Math.ceil(maxHours) + 3;
    let step = Math.ceil(yM / 4);
    if (step < 1) step = 1;
    
    let ticks = [];
    for (let i = step; i < yM; i += step) {
      ticks.push(i);
    }
    
    return { yMax: yM, yTicks: ticks };
  }, [dailyStreamHours]);

  const maxPointData = useMemo(() => {
    if (!processedData || processedData.length === 0) return null;
    return processedData.reduce((prev, curr) => (prev.rawSeconds > curr.rawSeconds) ? prev : curr, processedData[0]);
  }, [processedData]);

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        .recharts-wrapper * { outline: none !important; }
        *:focus { outline: none !important; }
      `}} />
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible relative">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <BarChart data={processedData} margin={{ top: 35, right: 35, left: 15, bottom: 15 }} style={{ overflow: 'visible' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="dateMs" stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8a88a8' }}
              minTickGap={40} tickMargin={10} height={35}
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.toLocaleString('en-US', { month: 'short' })} '${d.toLocaleString('en-US', { year: '2-digit' })}`;
              }}
            >
              <Label value="Timeline" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>
            <YAxis 
              stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ angle: -90, textAnchor: 'middle', dx: -10, fill: '#8a88a8', fontSize: 10 }}
              allowDecimals={false} width={45} domain={[0, yMax]} ticks={yTicks}
              tickFormatter={(v) => `${Math.round(v)}h`}
            >
              <Label value="Playtime (Hours)" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} isAnimationActive={false} />
            <Bar dataKey="hours" radius={[2, 2, 0, 0]} isAnimationActive={false} minPointSize={2}>
              {processedData?.map((entry, index) => {
                let fill = '#ff5c5c'; 
                if (entry.hours > 0 && entry.hours <= entry.midThreshold) fill = '#f5a623'; 
                if (entry.hours > entry.midThreshold) fill = '#3ddc84'; 
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
            {maxPointData && maxPointData.rawSeconds > 0 && (
              <ReferenceDot x={maxPointData.dateMs} y={maxPointData.hours} isFront={true} r={0} shape={<PermanentMaxTooltip maxData={maxPointData} />} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}