import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Label } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    let color = '#3ddc84'; 
    if (data.status === 'Completed') color = '#f5a623'; 
    if (data.status === 'Abandoned') color = '#ff5c5c'; 
    return (
      <div className="bg-[#0a0a0a] border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none">
        <div className="font-bold text-white/50 mb-1">{data.streamTitle}</div>
        <div className="text-white/40 mb-2" style={{ fontSize: '10px' }}>{data.displayDate}</div>
        <div className="flex items-center gap-2 font-bold" style={{ color }}>{formatFullTime(data.duration)}</div>
      </div>
    );
  }
  return null;
};

export default function Card3Slide4({ data }) {
  const { allStreamsChronological, chronoYMax, chronoYTicks } = data;

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible relative">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <BarChart tabIndex={-1} data={allStreamsChronological} margin={{ top: 35, right: 35, left: 15, bottom: 15 }} style={{ overflow: 'visible' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="index" stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8a88a8' }} minTickGap={40} tickMargin={10} height={35} tickFormatter={(val) => `#${val}`}>
              <Label value="Stream Sequence" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>
            <YAxis stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ angle: -90, textAnchor: 'middle', dx: -10, fill: '#8a88a8', fontSize: 10 }} allowDecimals={false} width={45} domain={[0, chronoYMax]} ticks={chronoYTicks} tickFormatter={(v) => `${Math.round(v)}h`}>
              <Label value="Playtime (Hours)" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} isAnimationActive={false} />
            <Bar dataKey="hours" radius={[2, 2, 0, 0]} isAnimationActive={false} minPointSize={2}>
              {allStreamsChronological?.map((entry, index) => {
                let fill = '#3ddc84'; 
                if (entry.status === 'Completed') fill = '#f5a623'; 
                if (entry.status === 'Abandoned') fill = '#ff5c5c'; 
                return <Cell key={`cell-${index}`} fill={fill} style={{ transition: 'fill 0.2s' }} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}