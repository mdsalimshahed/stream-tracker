import React, { useMemo } from 'react';
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
        <div className="flex items-center gap-2 font-bold" style={{ color }}>
          {count} stream{count !== 1 ? 's' : ''}
        </div>
      </div>
    );
  }
  return null;
};

export default function Card1Slide2({ data }) {
  const { hourlyStreamData } = data;

  const processedData = useMemo(() => {
    if (!hourlyStreamData || hourlyStreamData.length === 0) return [];
    const maxCount = Math.max(...hourlyStreamData.map(d => d.count), 0);
    const midThreshold = maxCount / 2;
    return hourlyStreamData.map(d => ({ ...d, midThreshold }));
  }, [hourlyStreamData]);

  // Restricted to generate a maximum of 3 clean ticks total
  const yAxisTicks = useMemo(() => {
    if (!processedData || processedData.length === 0) return [20, 40];
    const maxCount = Math.max(...processedData.map(d => d.count), 0);

    if (maxCount <= 3) {
      return [1, 2, 3].filter(v => v <= maxCount);
    }

    // Mathematically split the peak data into clean increments aiming for exactly 2 or 3 labels
    const midPoint = Math.round(maxCount / 2);
    const roundedMid = Math.ceil(midPoint / 5) * 5;
    const roundedMax = Math.ceil(maxCount / 10) * 10;

    // Returns a perfectly spaced list of 2 or 3 clean figures at best (e.g., [20, 40] or [15, 30, 45])
    if (roundedMid * 2 >= roundedMax && roundedMid > 0) {
      return [roundedMid, roundedMax];
    } else {
      const step = Math.ceil(maxCount / 3 / 5) * 5 || 5;
      return [step, step * 2, step * 3];
    }
  }, [processedData]);

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <div className="w-full h-full flex-1 outline-none relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedData} margin={{ top: 25, right: 20, left: 15, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            
            <XAxis 
              dataKey="displayHour" 
              stroke="#8a88a8" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: '#8a88a8' }}
              tickMargin={10}
              height={35}
            >
              <Label value="Hour of Day" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>

            <YAxis 
              stroke="#8a88a8" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: '#8a88a8', angle: -90, textAnchor: 'middle', dx: -10 }}
              allowDecimals={false} 
              width={45}
              ticks={yAxisTicks}
              domain={[0, 'dataMax']}
            >
              <Label value="Stream Count" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            
            {/* minPointSize={4} highlights zero-value bars beautifully in red straight on the line */}
            <Bar dataKey="count" radius={[2, 2, 0, 0]} minPointSize={4}>
              {processedData?.map((entry, index) => {
                let fill = '#ff5c5c'; // Zero hours render strictly red
                
                if (entry.count > 0) {
                  if (entry.count <= entry.midThreshold) {
                    fill = '#f5a623'; // Mid values
                  } else {
                    fill = '#3ddc84'; // High values
                  }
                }
                
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}