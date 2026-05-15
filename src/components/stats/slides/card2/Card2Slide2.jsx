import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const FULL_DAYS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none">
        <div className="font-bold text-white/50 mb-1">{data.displayDay}</div>
        <div className="flex items-center gap-2 text-[#fa6ca0] font-bold">
          {data.count} {data.count === 1 ? 'stream' : 'streams'}
        </div>
      </div>
    );
  }
  return null;
};

export default function Card2Slide2({ data }) {
  const { dowStreamData } = data;

  const yAxisConfig = useMemo(() => {
    if (!dowStreamData || dowStreamData.length === 0) return { ticks: [0, 10], domain: [0, 10] };
    
    const maxCount = Math.max(...dowStreamData.map(d => d.count), 0);
    
    // Dynamic step: Use multiples of 10 for small libraries, 50 for large ones
    const step = maxCount < 50 ? 10 : 50;
    const yMax = Math.max(step, Math.ceil(maxCount / step) * step);
    
    const ticks = [];
    for (let i = 0; i <= yMax; i += step) {
      ticks.push(i);
    }
    return { ticks, domain: [0, yMax] };
  }, [dowStreamData]);

  const dynamicTitle = useMemo(() => {
    if (!dowStreamData || dowStreamData.length === 0) return 'No streams recorded yet';
    const max = dowStreamData.reduce((prev, curr) => (prev.count > curr.count) ? prev : curr, dowStreamData[0]);
    if (!max || max.count === 0) return 'No streams recorded yet';
    
    const fullDayName = FULL_DAYS[max.displayDay] || max.displayDay;
    return `${max.count} ${max.count === 1 ? 'stream' : 'streams'} were done on ${fullDayName}`;
  }, [dowStreamData]);

  return (
    <div className="slide-container flex flex-col justify-center bg-black/40 p-4 h-full outline-none">
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        .recharts-wrapper * { outline: none !important; }
        *:focus { outline: none !important; }
      `}} />
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible relative">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <AreaChart data={dowStreamData} margin={{ top: 50, right: 10, left: -20, bottom: 0 }} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="colorDow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fa6ca0" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#fa6ca0" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <text x="50%" y="20" textAnchor="middle" fill="#8a88a8" fontSize={11} fontWeight="bold" letterSpacing={1} className="uppercase">
              {dynamicTitle}
            </text>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="displayDay" 
              stroke="#8a88a8" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: '#8a88a8' }}
            />
            <YAxis 
              stroke="#8a88a8" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: '#8a88a8' }}
              allowDecimals={false}
              width={40}
              domain={yAxisConfig.domain}
              ticks={yAxisConfig.ticks}
              tickFormatter={(v) => v === 0 ? '' : v}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} isAnimationActive={false} />
            
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#fa6ca0" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorDow)" 
              dot={{ r: 2, fill: '#fa6ca0', strokeWidth: 0 }} 
              activeDot={{ r: 6, fill: '#fff', stroke: '#fa6ca0', strokeWidth: 2 }} 
              isAnimationActive={false} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}