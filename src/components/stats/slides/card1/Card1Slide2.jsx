import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Label } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const count = data.count;
    let color = '#ff5c5c'; 
    if (count > 0 && count <= data.midThreshold) color = '#f5a623'; 
    if (count > data.midThreshold) color = '#3ddc84'; 
    return (
      <div className="bg-[#0a0a0a] border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50">
        <div className="font-bold text-white/50 mb-1">{data.displayHour}</div>
        <div className="flex items-center gap-2 font-bold" style={{ color }}>{count} stream{count !== 1 ? 's' : ''}</div>
      </div>
    );
  }
  return null;
};

export default function Card1Slide2({ data }) {
  const { processedHourlyData, hourlyYTicks } = data;

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <div className="w-full h-full flex-1 outline-none relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedHourlyData} margin={{ top: 25, right: 20, left: 15, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="displayHour" stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8a88a8' }} tickMargin={10} height={35}>
              <Label value="Hour of Day" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>
            <YAxis stroke="#8a88a8" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#8a88a8', angle: -90, textAnchor: 'middle', dx: -10 }} allowDecimals={false} width={45} ticks={hourlyYTicks} domain={[0, 'dataMax']}>
              <Label value="Stream Count" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} minPointSize={4}>
              {processedHourlyData?.map((entry, index) => {
                let fill = '#ff5c5c';
                if (entry.count > 0) { fill = entry.count <= entry.midThreshold ? '#f5a623' : '#3ddc84'; }
                return <Cell key={`cell-${index}`} fill={fill} style={{ transition: 'fill 0.2s' }} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}