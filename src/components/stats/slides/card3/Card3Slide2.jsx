import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

const Slide9Tooltip = ({ active, payload, selectedGame }) => {
  if (!active || !payload || !payload.length) return null;
  const originalData = payload[0].payload;

  if (selectedGame && originalData.gameName !== selectedGame) return null;

  // If no game is selected, we want the tooltip to snap/persist the data for the END dot 
  // of whatever line the user is currently hovering closest to.
  const data = (!selectedGame && originalData.endDotData) ? originalData.endDotData : originalData;

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const d = new Date(data.date);
  const formattedDate = `Date: ${getOrdinal(d.getDate())} ${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;

  return (
    <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none whitespace-nowrap">
      <div className="text-white font-bold mb-1 text-sm">{data.gameName}</div>
      <div className="text-white/50 mb-2" style={{ fontSize: '10px' }}>{formattedDate}</div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.lineColor || payload[0].stroke }}></span>
        <span className="font-bold text-[#e8c87a]">{formatFullTime(data.rawSeconds ?? Math.round(data.cumulativeHours * 3600))}</span>
      </div>
    </div>
  );
};

const Slide9TrailEndDot = (props) => {
  const { cx, cy, payload, image, status, isFaded, isSelected, onSelect } = props;
  
  if (cx === undefined || cy === undefined) return null; 

  const imgSrc = image || 'https://placehold.co/100x100/1e293b/475569?text=Game';
  const clipId = `clip-end-${payload.gameName.replace(/[^a-zA-Z0-9]/g, '')}-${cx}-${cy}`;
  let ringColor = status === 'Completed' ? "#f5a623" : status === 'Ongoing' ? "#3ddc84" : "#ff5c5c";

  const ringRadius = isSelected ? 31 : 12;
  const imgRadius = isSelected ? 27 : 10;
  const imgSize = imgRadius * 2;
  
  return (
    <g 
      style={{ opacity: isFaded ? 0.2 : 1, transition: 'opacity 0.3s ease', cursor: 'pointer', outline: 'none', pointerEvents: 'auto' }}
      onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); onSelect(); }}
    >
      <circle cx={cx} cy={cy} r={isSelected ? 32 : 16} fill="transparent" style={{ outline: 'none' }} /> 
      <circle cx={cx} cy={cy} r={ringRadius} fill={ringColor} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', outline: 'none' }} />
      <clipPath id={clipId}><circle cx={cx} cy={cy} r={imgRadius} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} /></clipPath>
      <image x={cx - imgRadius} y={cy - imgRadius} width={imgSize} height={imgSize} href={imgSrc} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" style={{ outline: 'none', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
      {isSelected && <circle cx={cx} cy={cy} r={37} fill="none" stroke="#ffffff" strokeWidth={3} />}
    </g>
  );
};

export default function Card3Slide2({ data }) {
  const { streamProgressionLines, progressionDates, gamesTimeline } = data;
  const [selectedGame, setSelectedGame] = useState(null);

  const processedLines = useMemo(() => {
    return streamProgressionLines.map(line => {
      const dataMap = new Map(line.data.map(d => [d.xIndex, d]));
      const minX = Math.min(...line.data.map(d => d.xIndex));
      const maxX = Math.max(...line.data.map(d => d.xIndex));
      
      const continuousData = [];
      let lastKnownHours = 0; 
      let lastKnownSecs = 0;

      for (let idx = minX; idx <= maxX; idx++) {
        if (dataMap.has(idx)) {
          const point = dataMap.get(idx);
          lastKnownHours = point.cumulativeHours; 
          lastKnownSecs = point.rawSeconds;
          continuousData.push({ ...point, lineColor: line.color });
        } else {
          continuousData.push({ 
            xIndex: idx, 
            cumulativeHours: lastKnownHours, 
            rawSeconds: lastKnownSecs, 
            date: progressionDates[idx], 
            gameName: line.gameName,
            lineColor: line.color
          });
        }
      }

      const endDot = continuousData[continuousData.length - 1];

      // Attach the endDot to every data point so the Tooltip can snap to it when unselected
      const fullyPopulatedData = continuousData.map(d => ({
        ...d,
        endDotData: endDot
      }));

      return { ...line, data: fullyPopulatedData, endDot, minX, maxX };
    });
  }, [streamProgressionLines, progressionDates]);

  const xDomain = useMemo(() => {
    if (selectedGame && processedLines.length > 0) {
      const gameLine = processedLines.find(l => l.gameName === selectedGame);
      if (gameLine) {
        return [Math.max(0, gameLine.minX - 2), gameLine.maxX + 2];
      }
    }
    return ['dataMin', 'dataMax'];
  }, [selectedGame, processedLines]);

  const yMax = useMemo(() => {
    let max = 0;
    processedLines.forEach(l => {
      if (l.endDot && l.endDot.cumulativeHours > max) max = l.endDot.cumulativeHours;
    });
    if (max === 0) return 50; 
    return Math.ceil(max / 50) * 50; 
  }, [processedLines]);

  const handleBackgroundClick = (e) => {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag === 'circle' || tag === 'image') return;
    setSelectedGame(null);
  };

  return (
    <div className="slide-container flex flex-col justify-start bg-black/40 pt-4 pb-2 px-4 h-full outline-none" onClick={handleBackgroundClick}>
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        .recharts-wrapper * { outline: none !important; }
        .recharts-line-dots, .recharts-area-dots { clip-path: none !important; }
        *:focus { outline: none !important; }
      `}} />
      <div className="w-full flex-1 min-h-0 relative outline-none overflow-visible">
        
        {/* LAYER 1: BACKGROUND LINES */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
            <LineChart margin={{ top: 60, right: 35, left: 10, bottom: 10 }} style={{ overflow: 'visible' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              
              <XAxis type="number" dataKey="xIndex" domain={xDomain} allowDataOverflow={true} allowDecimals={false} height={30} tick={false} axisLine={true} tickLine={false} />
              <YAxis domain={[0, yMax]} width={45} tick={false} axisLine={true} tickLine={false} />
              
              {processedLines?.map((line, idx) => {
                const isSelected = selectedGame === line.gameName;
                const isDimmed = selectedGame !== null && !isSelected;
                return (
                  <Line 
                    key={`bg-line-${idx}`} 
                    data={line.data} 
                    type="monotone" 
                    dataKey="cumulativeHours" 
                    stroke={line.color}
                    strokeWidth={isSelected ? 3 : 1.5} 
                    strokeOpacity={isDimmed ? 0.1 : 1}
                    activeDot={false} 
                    dot={false}
                    isAnimationActive={false} 
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* LAYER 2: FOREGROUND TOOLTIPS AND DOTS */}
        <div className="absolute inset-0 z-10">
          <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
            <LineChart margin={{ top: 60, right: 35, left: 10, bottom: 10 }} style={{ overflow: 'visible' }}>
              
              <text 
                x="35%" 
                y={40} 
                textAnchor="middle" 
                fill="rgba(255,255,255,0.5)" 
                fontSize={20} 
                fontWeight="regular" 
                letterSpacing={2} 
                className="uppercase pointer-events-none"
              >
                Progression
              </text>
              
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                type="number" dataKey="xIndex" domain={xDomain} allowDataOverflow={true} allowDecimals={false} stroke="#8a88a8" axisLine={false} 
                tickLine={false} tickMargin={8} height={30} tickCount={8} minTickGap={5}
                tick={{ fill: '#8a88a8', fontSize: 11 }}
                tickFormatter={(val) => {
                  if (!Number.isInteger(val)) return ''; 
                  if (val >= 0 && val < progressionDates.length) {
                    const ts = progressionDates[val];
                    if (!ts) return '';
                    const d = new Date(ts);
                    if (isNaN(d.getTime())) return '';
                    return `${d.toLocaleDateString('en-US', { month: 'short' })} '${d.toLocaleDateString('en-US', { year: '2-digit' })}`;
                  }
                  return '';
                }} 
              />
              <YAxis 
                domain={[0, yMax]} stroke="#8a88a8" axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? '' : `${Math.round(v)}h`}  
                width={45} tickMargin={5} tick={{ angle: -90, textAnchor: 'middle', fill: '#8a88a8', fontSize: 11 }}
              />
              
              <Tooltip 
                content={<Slide9Tooltip selectedGame={selectedGame} />} 
                cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1 }} 
                isAnimationActive={false} 
                shared={false} 
                wrapperStyle={{ zIndex: 1000 }}
              />
              
              {processedLines?.map((line, idx) => {
                const isSelected = selectedGame === line.gameName;
                const gameInfo = gamesTimeline?.find(g => g.name === line.gameName);
                
                if (!selectedGame) {
                  return (
                    <Line 
                      key={`fg-line-${idx}`} 
                      data={line.data} 
                      type="monotone" 
                      dataKey="cumulativeHours" 
                      stroke="transparent" 
                      activeDot={false}
                      dot={(props) => {
                        if (props.index === line.data.length - 1) {
                          return <Slide9TrailEndDot {...props} image={line.image || gameInfo?.image} status={line.status || gameInfo?.status} isSelected={false} onSelect={() => setSelectedGame(line.gameName)} />
                        }
                        return null;
                      }}
                      isAnimationActive={false}
                    />
                  );
                } else if (isSelected) {
                  return (
                    <Line 
                      key={`fg-line-${idx}`} 
                      data={line.data} 
                      type="monotone" 
                      dataKey="cumulativeHours" 
                      stroke="transparent" 
                      activeDot={false}
                      dot={(props) => {
                        if (props.index === line.data.length - 1) {
                          return <Slide9TrailEndDot {...props} image={line.image || gameInfo?.image} status={line.status || gameInfo?.status} isSelected={true} onSelect={() => setSelectedGame(null)} />
                        }
                        return null;
                      }}
                      isAnimationActive={false}
                    />
                  );
                } else {
                  return (
                    <ReferenceDot 
                      key={`fg-dim-${idx}`}
                      x={line.endDot.xIndex}
                      y={line.endDot.cumulativeHours}
                      isFront={true}
                      shape={(props) => (
                        <Slide9TrailEndDot 
                          {...props} 
                          payload={{ gameName: line.gameName }}
                          image={line.image || gameInfo?.image} 
                          status={line.status || gameInfo?.status} 
                          isFaded={true} 
                          isSelected={false} 
                          onSelect={() => setSelectedGame(line.gameName)} 
                        />
                      )}
                    />
                  );
                }
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}