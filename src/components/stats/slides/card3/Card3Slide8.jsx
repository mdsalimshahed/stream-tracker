// src/components/stats/slides/card3/Card3Slide8.jsx
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Label } from 'recharts';

const FULL_DAYS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const count = data.realCount;
    const dayFull = FULL_DAYS[data.displayDay] || data.displayDay;
    return (
      <div className="bg-[#0a0a0a] border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50">
        <div className="font-bold text-white/50 mb-1">{dayFull}</div>
        <div className="flex items-center gap-2 text-[#fa6ca0] font-bold">
          {count} stream{count !== 1 ? 's' : ''}
        </div>
      </div>
    );
  }
  return null;
};

export default function Card3Slide8({ data }) {
  const { processedDowData, dowDomainMax, dowValidTicks, dowTickMap } = data;

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <div className="w-full h-full flex-1 outline-none relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart tabIndex={-1} data={processedDowData} margin={{ top: 25, right: 20, left: 15, bottom: 15 }}>
            <defs>
              <linearGradient id="colorDow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fa6ca0" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#fa6ca0" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="displayDay" stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8a88a8' }} tickMargin={10} height={35}>
              <Label value="Day of Week" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>
            <YAxis stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8a88a8', angle: -90, textAnchor: 'middle', dx: -10 }} allowDecimals={false} width={45} domain={[0, dowDomainMax]} ticks={dowValidTicks} tickFormatter={(v) => dowTickMap[v] !== undefined ? dowTickMap[v] : ''}>
              <Label value="Stream Count" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="fakeCount" stroke="#fa6ca0" strokeWidth={3} fillOpacity={1} fill="url(#colorDow)" dot={{ r: 3, fill: '#fa6ca0', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: '#fa6ca0', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}