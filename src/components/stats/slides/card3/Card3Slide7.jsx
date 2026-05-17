// src/components/stats/slides/card3/Card3Slide7.jsx
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Label } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none whitespace-nowrap">
        <div className="text-white font-bold mb-1 text-sm">{data.name}</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }}></span>
          <span className="font-bold text-[#e8c87a]">
            {formatFullTime(data.rawSeconds ?? Math.round(data.hours * 3600))}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function Card3Slide7({ data }) {
  const { statusData, statusYMax, statusYTicks } = data;
  
  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <div className="w-full h-full flex-1 outline-none relative">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <AreaChart tabIndex={-1} data={statusData} margin={{ top: 25, right: 20, left: 15, bottom: 15 }} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="areaStatusGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3ddc84" stopOpacity={0.6}/>
                <stop offset="50%" stopColor="#f5a623" stopOpacity={0.6}/>
                <stop offset="100%" stopColor="#ff5c5c" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="strokeStatusGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3ddc84" />
                <stop offset="50%" stopColor="#f5a623" />
                <stop offset="100%" stopColor="#ff5c5c" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={false} axisLine={false} stroke="#8a88a8" tickLine={false} height={15} tickMargin={10}>
              <Label value="Game Status" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>
            <YAxis stroke="#8a88a8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} width={45} tick={{ angle: -90, textAnchor: 'middle', dx: -10, fill: '#8a88a8'}} domain={[0, statusYMax]} ticks={statusYTicks}>
              <Label value="Playtime (Hours)" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} isAnimationActive={false} />
            <Area type="monotone" dataKey="hours" stroke="url(#strokeStatusGradient)" strokeWidth={3} fill="url(#areaStatusGradient)" activeDot={{ r: 6, fill: '#fff', stroke: 'none' }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}