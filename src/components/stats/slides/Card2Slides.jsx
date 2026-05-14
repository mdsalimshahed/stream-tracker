// src/components/stats/slides/Card2Slides.jsx
import React from 'react';
import { renderPlaceholder } from './SlideHelpers';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50">
        <div className="text-white/50 mb-1">{data.name}</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }}></span>
          <span className="font-bold text-white">{data.hours} hrs</span>
        </div>
      </div>
    );
  }
  return null;
};

export const getCard2Slide = (index, data) => {
  const { totalGamesCount, totalGames, statusData } = data;
  
  switch (index) {
    case 0: return (
      <div className="slide-container">
        <div className="stat-number top-number">{totalGamesCount}</div>
        <div className="stat-label">{totalGames === 1 ? 'Game in Library' : 'Games in Library'}</div>
      </div>
    );
    
    case 1: return (
      <div className="slide-container justify-center bg-black/40 pt-8 pb-4 outline-none">
        <style dangerouslySetInnerHTML={{ __html: `
          .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { outline: none !important; }
          .recharts-wrapper * { outline: none !important; }
          *:focus { outline: none !important; }
        `}} />
        <h3 className="text-sm sm:text-base font-bold text-white/50 uppercase tracking-widest mb-4 drop-shadow-md text-center pointer-events-none">
          Playtime by Status
        </h3>
        <div className="w-full h-48 sm:h-56 outline-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={statusData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
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
              <XAxis 
                dataKey="name" 
                tick={false}          // Hides the text labels
                axisLine={true}       // Ensures the X-axis line is shown
                stroke="#8a88a8" 
                tickLine={false} 
                height={10}
                dy={0} 
              />
              <YAxis stroke="#8a88a8" fontSize={11} fontFamily='"Space Mono", monospace' tickLine={false} axisLine={true} tickFormatter={(v) => `${v}h`} interval={3} width={45} tick={{ angle: -90, textAnchor: 'middle', fill: '#8a88a8', fontSize: 11, fontFamily: '"Space Mono", monospace' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} isAnimationActive={false} />
              <Area type="monotone" dataKey="hours" stroke="url(#strokeStatusGradient)" strokeWidth={3} fill="url(#areaStatusGradient)" activeDot={{ r: 6, fill: '#fff', stroke: 'none' }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
    
    default: return renderPlaceholder(index * 3 + 2);
  }
};