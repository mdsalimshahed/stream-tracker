// src/components/stats/slides/card3/Card3Slide9.jsx
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
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
  const { deficitData, deficitYMax, deficitYMin } = data;

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
      <div className="absolute bottom-2 left-4 z-40 pointer-events-none font-sans text-[11px] tracking-wide text-white/40 leading-normal">
        Time difference of <br /> session and play time per stream
      </div>
      <div className="w-full h-full flex-1 outline-none overflow-hidden relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart tabIndex={-1} data={deficitData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="index" hide={true} padding={{ left: 10, right: 10 }} />
            <YAxis domain={[deficitYMin, deficitYMax]} hide={true} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} isAnimationActive={false} />
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