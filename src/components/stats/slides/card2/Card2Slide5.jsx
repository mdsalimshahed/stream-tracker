// src/components/stats/slides/card2/Card2Slide5.jsx
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ReferenceDot } from 'recharts';
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
      <div className="bg-[#0a0a0a] border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none">
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

const PermanentTooltip = (props) => {
  const { cx, cy, pointData } = props;
  if (cx === undefined || cy === undefined || !pointData) return null;

  const isDiscarded = pointData.diff > 0;
  const color = isDiscarded ? '#ff5c5c' : '#3ddc84';
  const label = isDiscarded ? 'Discarded:' : 'Gained:';

  const d = new Date(pointData.dateMs);
  const fullDate = `${getOrdinal(d.getDate())} ${d.toLocaleDateString('en-US', { month: 'long' })}, ${d.getFullYear()}`;

  const yOffset = isDiscarded ? -120 : 10;
  const alignClass = isDiscarded ? 'justify-end pb-[6px]' : 'justify-start pt-[6px]';

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <foreignObject x="-150" y={yOffset} width="300" height="110" className="overflow-visible pointer-events-none">
        <div className={`w-full h-full flex flex-col items-center ${alignClass}`}>
          <div className="relative bg-[#0a0a0a] border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl text-center w-max max-w-[280px]">
            {isDiscarded ? (
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-[11px] h-[11px] bg-[#0a0a0a] border-b border-r border-white/20 rotate-45 z-0"></div>
            ) : (
              <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-[11px] h-[11px] bg-[#0a0a0a] border-t border-l border-white/20 rotate-45 z-0"></div>
            )}
            <div className="relative z-10 flex flex-col items-center">
              <div className="font-bold text-white mb-1 truncate w-full max-w-[250px]" style={{ fontSize: '11px' }}>{pointData.streamTitle}</div>
              <div className="text-white/40 mb-2" style={{ fontSize: '10px' }}>{fullDate}</div>
              <div className="flex items-center gap-2 font-bold" style={{ color }}>
                {label} {formatFullTime(Math.abs(pointData.diff))}
              </div>
            </div>
          </div>
        </div>
      </foreignObject>
      <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
    </g>
  );
};

export default function Card2Slide5({ data }) {
  const { deficitData } = data;

  const { yMax, yMin, maxPoint, minPoint } = useMemo(() => {
    if (!deficitData || deficitData.length === 0) return { yMax: 60, yMin: -60, maxPoint: null, minPoint: null };
    
    let max = deficitData[0];
    let min = deficitData[0];
    
    deficitData.forEach(d => {
      if (d.diff > max.diff) max = d;
      if (d.diff < min.diff) min = d;
    });

    let maxDiff = max.diff;
    let minDiff = min.diff;
    
    const maxMins = Math.ceil(maxDiff / 60);
    const minMins = Math.floor(minDiff / 60);

    const absMax = Math.max(Math.abs(maxMins), Math.abs(minMins), 10);
    const yM = Math.ceil(absMax / 10) * 10;
    
    return { 
      yMax: yM * 60, 
      yMin: -yM * 60,
      maxPoint: max.diff > 0 ? max : null,
      minPoint: min.diff < 0 ? min : null
    };
  }, [deficitData]);

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        .recharts-wrapper * { outline: none !important; }
        *:focus { outline: none !important; }
      `}} />
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible relative">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <BarChart data={deficitData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }} style={{ overflow: 'visible' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="index" hide={true} />
            <YAxis domain={[yMin, yMax]} hide={true} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} isAnimationActive={false} />
            <Bar dataKey="diff" isAnimationActive={false} minPointSize={2}>
              {deficitData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.diff > 0 ? '#ff5c5c' : '#3ddc84'} />
              ))}
            </Bar>
            {maxPoint && (
              <ReferenceDot x={maxPoint.index} y={maxPoint.diff} isFront={true} r={0} shape={<PermanentTooltip pointData={maxPoint} />} />
            )}
            {minPoint && (
              <ReferenceDot x={minPoint.index} y={minPoint.diff} isFront={true} r={0} shape={<PermanentTooltip pointData={minPoint} />} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}