// src/components/stats/slides/card3/Card3Slide9.jsx
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Label } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isDiscarded = data.diff > 0;
    const color = isDiscarded ? '#ff5c5c' : '#3ddc84';
    const d = new Date(data.dateMs);
    const fullDate = `${getOrdinal(d.getDate())} ${d.toLocaleDateString('en-US', { month: 'long' })}, ${d.getFullYear()}`;
    return (
      <div className="bg-[#0a0a0a] border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none whitespace-normal max-w-xs">
        <div className="font-bold text-white/50 mb-1">{data.streamTitle}</div>
        <div className="text-white/40 mb-2" style={{ fontSize: '10px' }}>{fullDate}</div>
        <div className="flex items-center gap-2 font-bold" style={{ color }}>
          {isDiscarded ? 'Discarded:' : 'Gained:'} {formatFullTime(Math.abs(data.diff))}
        </div>
      </div>
    );
  }
  return null;
};

export default function Card3Slide9({ data }) {
  const { deficitData, deficitYMax, deficitYMin, deficitYTicks } = data;

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-visible">
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible relative">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <BarChart tabIndex={-1} data={deficitData} margin={{ top: 35, right: 35, left: 15, bottom: 15 }} style={{ overflow: 'visible' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="index" stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8a88a8' }} minTickGap={40} tickMargin={10} height={35} tickFormatter={(val) => `#${val}`}>
              <Label value="Stream Sequence" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>
            <YAxis stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ angle: -90, textAnchor: 'middle', dx: -10, fill: '#8a88a8', fontSize: 10 }} allowDecimals={false} width={45} domain={[deficitYMin, deficitYMax]} ticks={deficitYTicks} tickFormatter={(v) => `${Math.round(v / 60)}m`}>
              <Label value="Time Diff" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} isAnimationActive={false} />
            <Bar dataKey="diff" isAnimationActive={false} minPointSize={2}>
              {deficitData?.map((entry, index) => {
                let fill = entry.diff > 0 ? '#ff5c5c' : '#3ddc84';
                return <Cell key={`cell-${index}`} fill={fill} style={{ transition: 'fill 0.2s' }} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}