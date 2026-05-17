import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Label } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

const getOrdinal = (n) => { const s = ["th", "st", "nd", "rd"]; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    let color = '#ff5c5c'; 
    if (data.hours > 0 && data.hours <= data.midThreshold) color = '#f5a623'; 
    if (data.hours > data.midThreshold) color = '#3ddc84'; 
    const d = new Date(data.dateMs);
    const fullDate = `${getOrdinal(d.getDate())} ${d.toLocaleDateString('en-US', { month: 'long' })}, ${d.getFullYear()}`;
    return (
      <div className="bg-[#0a0a0a] border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none">
        <div className="font-bold text-white/50 mb-1">{fullDate}</div>
        <div className="flex items-center gap-2 font-bold" style={{ color }}>{formatFullTime(data.rawSeconds)}</div>
      </div>
    );
  }
  return null;
};

export default function Card3Slide3({ data }) {
  const { processedDailyData, dailyYMax, dailyYTicks } = data;

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible relative">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <BarChart tabIndex={-1} data={processedDailyData} margin={{ top: 35, right: 35, left: 15, bottom: 15 }} style={{ overflow: 'visible' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="dateMs" stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8a88a8' }} minTickGap={40} tickMargin={10} height={35} tickFormatter={(val) => { const d = new Date(val); return `${d.toLocaleString('en-US', { month: 'short' })} '${d.toLocaleString('en-US', { year: '2-digit' })}`; }}>
              <Label value="Timeline" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>
            <YAxis stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ angle: -90, textAnchor: 'middle', dx: -10, fill: '#8a88a8', fontSize: 10 }} allowDecimals={false} width={45} domain={[0, dailyYMax]} ticks={dailyYTicks} tickFormatter={(v) => `${Math.round(v)}h`}>
              <Label value="Playtime (Hours)" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} isAnimationActive={false} />
            <Bar dataKey="hours" radius={[2, 2, 0, 0]} isAnimationActive={false} minPointSize={2}>
              {processedDailyData?.map((entry, index) => {
                let fill = '#ff5c5c'; 
                if (entry.hours > 0 && entry.hours <= entry.midThreshold) fill = '#f5a623'; 
                if (entry.hours > entry.midThreshold) fill = '#3ddc84'; 
                return <Cell key={`cell-${index}`} fill={fill} style={{ transition: 'fill 0.2s' }} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}