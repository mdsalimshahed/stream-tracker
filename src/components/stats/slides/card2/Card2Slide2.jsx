import React, { useMemo } from 'react';
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

export default function Card2Slide2({ data }) {
  const { dowStreamData } = data;

  const orderedDowData = useMemo(() => {
    if (!dowStreamData || dowStreamData.length === 0) return [];
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return [...dowStreamData].sort((a, b) => dayOrder.indexOf(a.displayDay) - dayOrder.indexOf(b.displayDay));
  }, [dowStreamData]);

  const { processedData, domainMax, validTicks, tickMap } = useMemo(() => {
    if (!orderedDowData || orderedDowData.length === 0) {
      return { processedData: [], domainMax: 10, validTicks: [10], tickMap: {} };
    }
    
    const counts = orderedDowData.map(d => d.count);
    const nonZeroCounts = counts.filter(c => c > 0);
    const minCount = nonZeroCounts.length > 0 ? Math.min(...nonZeroCounts) : 0;
    const maxCount = Math.max(...counts, 0);

    let step = 10;
    if (maxCount > 80) step = 20;

    const roundedMin = Math.floor(minCount / 10) * 10;

    if (roundedMin === 0 || maxCount < 10 || maxCount - roundedMin <= 5) {
      const ticks = [];
      for (let i = step; i <= maxCount + step; i += step) ticks.push(i);
      
      return {
        processedData: orderedDowData.map(d => ({ ...d, fakeCount: d.count, realCount: d.count })),
        domainMax: maxCount === 0 ? 10 : maxCount,
        validTicks: ticks, // Automatically contains no 0 values
        tickMap: {}
      };
    }

    const VISUAL_GAP = step; 
    // Stripped out '0' position value entirely to cleanly hide zero metric mapping
    const ticks = [VISUAL_GAP];
    const mapping = { [VISUAL_GAP]: roundedMin };
    
    let currentReal = roundedMin + step;
    let currentFake = VISUAL_GAP + step;
    
    while (currentReal <= maxCount + step) {
      ticks.push(currentFake);
      mapping[currentFake] = currentReal;
      currentReal += step;
      currentFake += step;
    }

    const processed = orderedDowData.map(d => {
      let visualValue = 0;
      if (d.count >= roundedMin) {
        visualValue = VISUAL_GAP + (d.count - roundedMin);
      } else if (d.count > 0) {
        visualValue = (d.count / roundedMin) * VISUAL_GAP;
      }
      return {
        ...d,
        fakeCount: visualValue,
        realCount: d.count 
      };
    });

    const maxVisualValue = Math.max(...processed.map(d => d.fakeCount));

    return {
      processedData: processed,
      domainMax: maxVisualValue === 0 ? 10 : maxVisualValue,
      validTicks: ticks.filter(t => t <= maxVisualValue), 
      tickMap: mapping
    };
  }, [orderedDowData]);

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <div className="w-full h-full flex-1 outline-none relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 25, right: 20, left: 15, bottom: 15 }}>
            <defs>
              <linearGradient id="colorDow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fa6ca0" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#fa6ca0" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            
            <XAxis 
              dataKey="displayDay" 
              stroke="#8a88a8" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: '#8a88a8' }}
              tickMargin={10}
              height={35}
            >
              <Label value="Day of Week" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
            </XAxis>

            <YAxis 
              stroke="#8a88a8" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 10, fill: '#8a88a8', angle: -90, textAnchor: 'middle', dx: -10 }}
              allowDecimals={false} 
              width={45}
              domain={[0, domainMax]} 
              ticks={validTicks}
              tickFormatter={(v) => {
                const real = tickMap[v];
                return real !== undefined ? real : ''; 
              }}
            >
              <Label value="Stream Count" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
            </YAxis>

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            
            <Area 
              type="monotone" 
              dataKey="fakeCount" 
              stroke="#fa6ca0" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorDow)" 
              dot={{ r: 3, fill: '#fa6ca0', strokeWidth: 0 }} 
              activeDot={{ r: 6, fill: '#fff', stroke: '#fa6ca0', strokeWidth: 2 }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}