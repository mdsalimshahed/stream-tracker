import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot, Label } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

const Slide9Tooltip = ({ active, payload, selectedGame }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  if (selectedGame && data.gameName !== selectedGame) return null;
  const getOrdinal = (n) => { const s = ["th", "st", "nd", "rd"]; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const d = new Date(data.date);
  return (
    <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none whitespace-nowrap">
      <div className="text-white font-bold mb-1 text-sm">{data.gameName}</div>
      <div className="text-white/50 mb-2" style={{ fontSize: '10px' }}>Date: {getOrdinal(d.getDate())} {d.toLocaleDateString('en-US', { month: 'long' })} {d.getFullYear()}</div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.lineColor || payload[0].stroke }}></span>
        <span className="font-bold text-[#e8c87a]">{formatFullTime(data.rawSeconds ?? Math.round(data.cumulativeHours * 3600))}</span>
      </div>
    </div>
  );
};

const Slide9TrailEndDot = ({ cx, cy, payload, image, status, isFaded, isSelected, onSelect }) => {
  if (cx === undefined || cy === undefined) return null; 
  const clipId = `clip-end-${payload.gameName.replace(/[^a-zA-Z0-9]/g, '')}-${cx}-${cy}`;
  let ringColor = status === 'Completed' ? "#f5a623" : status === 'Ongoing' ? "#3ddc84" : "#ff5c5c";
  const ringRadius = isSelected ? 31 : 12; const imgRadius = isSelected ? 27 : 10;
  return (
    <g style={{ opacity: isFaded ? 0.2 : 1, transition: 'opacity 0.3s ease', cursor: 'pointer', pointerEvents: 'auto', outline: 'none' }} tabIndex={-1} onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); onSelect(); }}>
      <circle cx={cx} cy={cy} r={isSelected ? 32 : 16} fill="transparent" style={{ outline: 'none' }} /> 
      <circle cx={cx} cy={cy} r={ringRadius} fill={ringColor} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', outline: 'none' }} />
      <clipPath id={clipId}><circle cx={cx} cy={cy} r={imgRadius} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} /></clipPath>
      <image x={cx - imgRadius} y={cy - imgRadius} width={imgRadius * 2} height={imgRadius * 2} href={image || 'https://placehold.co/100x100'} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" style={{ transition: 'all 0.3s', outline: 'none' }} />
    </g>
  );
};

export default function Card3Slide2({ data }) {
  const { processedProgressionLines, progressionDates, progressionYMax, progressionYTicks, gamesTimeline } = data;
  const [selectedGame, setSelectedGame] = useState(null);

  const xDomain = useMemo(() => {
    if (processedProgressionLines.length === 0) return ['dataMin', 'dataMax'];
    if (selectedGame) {
      const gLine = processedProgressionLines.find(l => l.gameName === selectedGame);
      if (gLine) {
        const pad = Math.max(2, Math.ceil((gLine.maxX - gLine.minX) * 0.08));
        return [gLine.minX - pad, gLine.maxX + pad];
      }
    }
    const gMin = Math.min(...processedProgressionLines.map(l => l.minX));
    const gMax = Math.max(...processedProgressionLines.map(l => l.maxX));
    const gPad = Math.max(2, Math.ceil((gMax - gMin) * 0.03));
    return [gMin - gPad, gMax + gPad];
  }, [selectedGame, processedProgressionLines]);

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none" tabIndex={-1} onClick={(e) => { if (e.target?.tagName?.toLowerCase() !== 'circle' && e.target?.tagName?.toLowerCase() !== 'image') setSelectedGame(null); }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        .recharts-wrapper * { outline: none !important; pointer-events: auto; }
        *:focus { outline: none !important; }
        .recharts-wrapper:focus, .recharts-surface:focus { outline: none !important; }
      `}} />
      <div className="w-full flex-1 min-h-0 relative outline-none overflow-visible">
        <div className="absolute inset-0 z-0 pointer-events-none outline-none">
          <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
            <LineChart tabIndex={-1} margin={{ top: 35, right: 35, left: 15, bottom: 15 }} style={{ overflow: 'visible', outline: 'none' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis type="number" dataKey="xIndex" domain={xDomain} allowDataOverflow={true} allowDecimals={false} height={35} tick={false} axisLine={false} tickLine={false} />
              <YAxis domain={[0, progressionYMax]} ticks={progressionYTicks} width={45} tick={false} axisLine={false} tickLine={false} padding={{ top: 35, bottom: 10 }} />
              {processedProgressionLines?.map((line, idx) => {
                const isSelected = selectedGame === line.gameName;
                const isDimmed = selectedGame !== null && !isSelected;
                return <Line key={`bg-line-${idx}`} data={line.data} type="monotone" dataKey="cumulativeHours" stroke={line.color} strokeWidth={isSelected ? 3 : 1.5} strokeOpacity={isDimmed ? 0.1 : 1} activeDot={false} dot={false} isAnimationActive={false} />;
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="absolute inset-0 z-10 outline-none">
          <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
            <LineChart tabIndex={-1} margin={{ top: 35, right: 35, left: 15, bottom: 15 }} style={{ overflow: 'visible', outline: 'none' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis type="number" dataKey="xIndex" domain={xDomain} allowDataOverflow={true} allowDecimals={false} stroke="#8a88a8" axisLine={false} tickLine={false} tickMargin={10} height={35} minTickGap={5} tick={{ fill: '#8a88a8', fontSize: 10 }} 
                tickFormatter={(val) => { 
                  if (Number.isInteger(val) && val >= 0 && val < progressionDates.length) { 
                    const d = new Date(progressionDates[val]); 
                    return `${d.toLocaleDateString('en-US', { month: 'short' })} '${d.toLocaleDateString('en-US', { year: '2-digit' })}`; 
                  } 
                  return ''; 
                }}
              >
                <Label value="Timeline" position="insideBottom" offset={-5} style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold' }} />
              </XAxis>
              <YAxis domain={[0, progressionYMax]} ticks={progressionYTicks} stroke="#8a88a8" axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v)}h`} width={45} padding={{ top: 35, bottom: 10 }} tick={{ angle: -90, textAnchor: 'middle', dx: -10, fill: '#8a88a8', fontSize: 10 }}>
                <Label value="Playtime (Hours)" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
              </YAxis>
              <Tooltip content={<Slide9Tooltip selectedGame={selectedGame} />} cursor={{ stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1 }} isAnimationActive={false} shared={false} wrapperStyle={{ zIndex: 1000 }} />
              
              {processedProgressionLines?.map((line, idx) => {
                const isSelected = selectedGame === line.gameName;
                const gameInfo = gamesTimeline?.find(g => g.name === line.gameName);
                if (!selectedGame) {
                  return <Line key={`fg-dot-${idx}`} data={[line.endDot]} type="monotone" dataKey="cumulativeHours" stroke="transparent" activeDot={false} dot={(props) => <Slide9TrailEndDot {...props} image={line.image || gameInfo?.image} status={line.status || gameInfo?.status} isSelected={false} onSelect={() => setSelectedGame(line.gameName)} />} isAnimationActive={false} />;
                } else if (isSelected) {
                  return <Line key={`fg-line-${idx}`} data={line.data} type="monotone" dataKey="cumulativeHours" stroke="transparent" activeDot={false} dot={(props) => (props.index === line.data.length - 1 ? <Slide9TrailEndDot {...props} image={line.image || gameInfo?.image} status={line.status || gameInfo?.status} isSelected={true} onSelect={() => setSelectedGame(null)} /> : null)} isAnimationActive={false} />;
                } else {
                  return <ReferenceDot key={`fg-dim-${idx}`} x={line.endDot.xIndex} y={line.endDot.cumulativeHours} isFront={true} shape={(props) => <Slide9TrailEndDot {...props} payload={{ gameName: line.gameName }} image={line.image || gameInfo?.image} status={line.status || gameInfo?.status} isFaded={true} isSelected={false} onSelect={() => setSelectedGame(line.gameName)} />} />;
                }
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}