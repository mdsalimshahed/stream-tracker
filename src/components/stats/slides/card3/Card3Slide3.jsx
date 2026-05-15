import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const hours = data.hours;
    let color = '#ff5c5c'; 
    if (hours > 0 && hours <= data.midThreshold) color = '#f5a623'; 
    if (hours > data.midThreshold) color = '#3ddc84'; 

    // Format full time string
    const h = Math.floor(data.rawSeconds / 3600);
    const m = Math.floor((data.rawSeconds % 3600) / 60);
    const s = Math.floor(data.rawSeconds % 60);
    
    let timeStr = [];
    if (h > 0) timeStr.push(`${h} hour${h !== 1 ? 's' : ''}`);
    if (m > 0 || h > 0) timeStr.push(`${m} minute${m !== 1 ? 's' : ''}`);
    timeStr.push(`${s} second${s !== 1 ? 's' : ''}`);

    // Format full date
    const d = new Date(data.dateMs);
    const fullDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
      <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none">
        <div className="font-bold text-white/50 mb-1">{fullDate}</div>
        <div className="flex items-center gap-2 font-bold" style={{ color }}>
          {timeStr.join(' ')}
        </div>
      </div>
    );
  }
  return null;
};

export default function Card3Slide3({ data }) {
  const { dailyStreamHours } = data;

  const processedData = useMemo(() => {
    if (!dailyStreamHours || dailyStreamHours.length === 0) return [];
    const maxHours = Math.max(...dailyStreamHours.map(d => d.hours), 0);
    const midThreshold = maxHours / 2;

    return dailyStreamHours.map(d => ({
      ...d,
      midThreshold
    }));
  }, [dailyStreamHours]);

  const yAxisConfig = useMemo(() => {
    if (!dailyStreamHours || dailyStreamHours.length === 0) return { ticks: [0, 5], domain: [0, 5] };
    const maxHours = Math.max(...dailyStreamHours.map(d => d.hours), 0);
    
    let step = 1;
    if (maxHours > 10) step = 5;
    else if (maxHours > 5) step = 2;

    const yMax = Math.max(step, Math.ceil(maxHours / step) * step);
    const ticks = [];
    for (let i = 0; i <= yMax; i += step) {
      ticks.push(i);
    }
    return { ticks, domain: [0, yMax] };
  }, [dailyStreamHours]);

  // Extract the specific day, calculate raw H:M:S, and construct the two-line string
  const titleData = useMemo(() => {
    if (!dailyStreamHours || dailyStreamHours.length === 0) return null;
    const max = dailyStreamHours.reduce((prev, curr) => (prev.rawSeconds > curr.rawSeconds) ? prev : curr, dailyStreamHours[0]);
    if (!max || max.rawSeconds === 0) return null;

    const h = Math.floor(max.rawSeconds / 3600);
    const m = Math.floor((max.rawSeconds % 3600) / 60);
    const s = Math.floor(max.rawSeconds % 60);
    
    const dateObj = new Date(max.dateMs);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
      line1: `${h} hours ${m} minutes ${s} seconds`,
      line2: `streamed on ${dateStr}`
    };
  }, [dailyStreamHours]);

  return (
    <div className="slide-container flex flex-col justify-center bg-black/40 p-4 h-full outline-none">
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        .recharts-wrapper * { outline: none !important; }
        *:focus { outline: none !important; }
      `}} />
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible relative">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <BarChart data={processedData} margin={{ top: 70, right: 10, left: -20, bottom: 0 }} style={{ overflow: 'visible' }}>
            
            {titleData ? (
              <text x="50%" y="20" textAnchor="middle" fill="#f0ece4" fontSize={15} fontWeight="bold" letterSpacing={1} className="uppercase drop-shadow-md">
                <tspan x="50%" dy="0">{titleData.line1}</tspan>
                <tspan x="50%" dy="22" fill="#8a88a8">{titleData.line2}</tspan>
              </text>
            ) : (
              <text x="50%" y="30" textAnchor="middle" fill="#8a88a8" fontSize={14} fontWeight="bold" letterSpacing={1} className="uppercase">
                NO STREAMS RECORDED YET
              </text>
            )}

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            
            <XAxis 
              dataKey="dateMs" 
              stroke="#8a88a8" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 9, fill: '#8a88a8' }}
              minTickGap={40} 
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.toLocaleString('en-US', { month: 'short' })} '${d.toLocaleString('en-US', { year: '2-digit' })}`;
              }}
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
              tickFormatter={(v) => v === 0 ? '' : `${v}h`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} isAnimationActive={false} />
            
            <Bar dataKey="hours" radius={[2, 2, 0, 0]} isAnimationActive={false} minPointSize={2}>
              {processedData?.map((entry, index) => {
                let fill = '#ff5c5c'; 
                if (entry.hours > 0 && entry.hours <= entry.midThreshold) fill = '#f5a623'; 
                if (entry.hours > entry.midThreshold) fill = '#3ddc84'; 

                return (
                  <Cell key={`cell-${index}`} fill={fill} />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}