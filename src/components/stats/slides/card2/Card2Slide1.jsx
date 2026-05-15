import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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

export default function Card2Slide1({ data }) {
  const { statusData } = data;
  const yMax = useMemo(() => {
    let max = 0;
    statusData?.forEach(d => {
      if (d.hours > max) max = d.hours;
    });
    
    if (max === 0) return 50; 
    return Math.ceil(max / 50) * 50; 
  }, [statusData]);
  return (
    <div className="slide-container justify-center bg-black/40 pt-8 pb-4 outline-none">
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        .recharts-wrapper * { outline: none !important; }
        *:focus { outline: none !important; }
      `}} />
      <div className="w-full h-48 sm:h-56 outline-none overflow-visible">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <AreaChart data={statusData} margin={{ top: 50, right: 20, left: -10, bottom: 5 }} style={{ overflow: 'visible' }}>
            
            <text 
              x="50%" 
              y={15} 
              textAnchor="middle" 
              fill="rgba(255,255,255,0.5)" 
              fontSize={14} 
              fontWeight="bold" 
              letterSpacing={2} 
              className="uppercase pointer-events-none"
            >
              Playtime by Status
            </text>

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
            <XAxis dataKey="name" tick={false} axisLine={true} stroke="#8a88a8" tickLine={false} height={10} dy={0} />
            <YAxis stroke="#8a88a8" fontSize={11} tickLine={false} axisLine={true} tickFormatter={(v) => v === 0 ? '' : `${v}h`} interval={3} width={45} tick={{ angle: -90, textAnchor: 'middle', fill: '#8a88a8'}} domain={[0,yMax]}/>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} isAnimationActive={false} />
            
            <Area type="monotone" dataKey="hours" stroke="url(#strokeStatusGradient)" strokeWidth={3} fill="url(#areaStatusGradient)" activeDot={{ r: 6, fill: '#fff', stroke: 'none' }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}