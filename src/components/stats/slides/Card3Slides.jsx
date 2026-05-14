// src/components/stats/slides/Card3Slides.jsx
import React, { useState, useMemo } from 'react';
import { CrossfadeImage } from '../../common/UIComponents';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// ==========================================
// TIME FORMATTER HELPER
// ==========================================
const formatFullTime = (totalSecs) => {
  if (totalSecs == null) return "0 hours 0 minutes 0 seconds";
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  
  let result = [];
  if (h > 0) result.push(`${h} hour${h !== 1 ? 's' : ''}`);
  if (m > 0 || h > 0) result.push(`${m} minute${m !== 1 ? 's' : ''}`);
  result.push(`${s} second${s !== 1 ? 's' : ''}`);
  
  return result.join(' ');
};

// ==========================================
// TOOLTIP COMPONENTS
// ==========================================
const Slide6Tooltip = ({ active, payload, selectedNode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (selectedNode && data.name !== selectedNode) return null;
    
    let ringColor = data.status === 'Completed' ? "#f5a623" : data.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c"; 

    const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const d = new Date(data.fullDate);
    const formattedDate = `${getOrdinal(d.getDate())} ${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;

    return (
      <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none whitespace-nowrap">
        <div className="text-white font-bold mb-1 text-sm">{data.name}</div>
        <div className="text-white/50 mb-2" style={{ fontSize: '10px' }}>Started: {formattedDate}</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ringColor }}></span>
          {/* Using raw exact seconds directly from memory source */}
          <span className="font-bold text-[#e8c87a]">{formatFullTime(data.rawSeconds ?? Math.round(data.hours * 3600))}</span>
        </div>
      </div>
    );
  }
  return null;
};

const Slide9Tooltip = ({ active, payload, selectedGame }) => {
  if (!selectedGame || !active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  if (data.gameName !== selectedGame) return null;

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const d = new Date(data.date);
  const formattedDate = `${getOrdinal(d.getDate())} ${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;

  return (
    <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl z-50 pointer-events-none whitespace-nowrap">
      <div className="text-white font-bold mb-1 text-sm">{data.gameName}</div>
      <div className="text-white/50 mb-2" style={{ fontSize: '10px' }}>{formattedDate}</div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: payload[0].stroke }}></span>
        {/* Using raw exact seconds directly from memory source */}
        <span className="font-bold text-[#e8c87a]">{formatFullTime(data.rawSeconds ?? Math.round(data.cumulativeHours * 3600))}</span>
      </div>
    </div>
  );
};

// ==========================================
// SLIDE 6 (AREA DOTS)
// ==========================================
const Slide6StaticDot = (props) => {
  const { cx, cy, payload, selectedNode, onSelect } = props;
  if (cx === undefined || cy === undefined) return null;
  
  const clipId = `clip-${payload.name.replace(/[^a-zA-Z0-9]/g, '')}-${cx}-${cy}`;
  let ringColor = payload.status === 'Completed' ? "#f5a623" : payload.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c"; 
  
  const isSelected = selectedNode === payload.name;
  
  const ringRadius = isSelected ? 31 : 12;
  const imgRadius = isSelected ? 27 : 10;
  const imgSize = imgRadius * 2;
  
  return (
    <g 
      style={{ opacity: selectedNode !== null && !isSelected ? 0.2 : 1, transition: 'opacity 0.3s ease', cursor: 'pointer', outline: 'none' }} 
      onClick={(e) => { 
        if (e && e.stopPropagation) e.stopPropagation(); 
        onSelect(isSelected ? null : payload.name); 
      }}
    >
      <circle cx={cx} cy={cy} r={isSelected ? 32 : 16} fill="transparent" /> 
      <circle cx={cx} cy={cy} r={ringRadius} fill={ringColor} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
      <clipPath id={clipId}><circle cx={cx} cy={cy} r={imgRadius} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} /></clipPath>
      <image x={cx - imgRadius} y={cy - imgRadius} width={imgSize} height={imgSize} href={payload.image} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" style={{ transition: 'all 0.3s' }} />
    </g>
  );
};

const Slide6Wrapper = ({ gamesTimeline }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  
  const xTicks = useMemo(() => {
    const ticks = []; let lastMonth = '';
    gamesTimeline?.forEach((g, i) => {
      const parts = g.month.split(' ');
      const formatted = parts.length === 2 ? `${parts[0]} '${parts[1].slice(-2)}` : g.month;
      if (formatted !== lastMonth) { ticks.push(i); lastMonth = formatted; }
    });
    return ticks;
  }, [gamesTimeline]);

  return (
    <div className="slide-container flex flex-col justify-start bg-black/40 pt-4 pb-2 px-4 h-full outline-none" onClick={(e) => {
      if (e.target.tagName?.toLowerCase() === 'circle' || e.target.tagName?.toLowerCase() === 'image') return;
      setSelectedNode(null);
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        .recharts-wrapper * { outline: none !important; }
        .recharts-line-dots, .recharts-area-dots { clip-path: none !important; }
        *:focus { outline: none !important; }
      `}} />
      <h3 className="text-xs sm:text-sm font-bold text-white/50 uppercase tracking-widest mb-1 drop-shadow-md text-center pointer-events-none shrink-0">Library Playtime Timeline</h3>
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <AreaChart data={gamesTimeline} margin={{ top: 35, right: 35, left: 10, bottom: 10 }} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="slide6GradientFill" x1="0" y1="0" x2="1" y2="0">
                {gamesTimeline?.map((g, i) => {
                  const offset = `${(i / Math.max(1, gamesTimeline.length - 1)) * 100}%`;
                  const color = g.status === 'Completed' ? "#f5a623" : g.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c";
                  return <stop key={`fill-${i}`} offset={offset} stopColor={color} stopOpacity={0.8} />;
                })}
              </linearGradient>
              <linearGradient id="slide6GradientStroke" x1="0" y1="0" x2="1" y2="0">
                {gamesTimeline?.map((g, i) => {
                  const offset = `${(i / Math.max(1, gamesTimeline.length - 1)) * 100}%`;
                  const color = g.status === 'Completed' ? "#f5a623" : g.status === 'Ongoing' ? "#3ddc84" : "#ff5c5c";
                  return <stop key={`stroke-${i}`} offset={offset} stopColor={color} stopOpacity={1} />;
                })}
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            
            <XAxis 
              dataKey="index" 
              ticks={xTicks} 
              stroke="#8a88a8" 
              tickLine={false} 
              axisLine={false} 
              tickMargin={8}
              dy={20} 
              tick={{ fill: '#8a88a8', fontSize: 11, fontFamily: '"Space Mono", monospace' }}
              tickFormatter={(val) => { const g = gamesTimeline[val]; const p = g?.month.split(' '); return p?.length === 2 ? `${p[0]} '${p[1].slice(-2)}` : g?.month; }} 
            />
            
            <YAxis 
              stroke="#8a88a8" 
              tickLine={false} 
              axisLine={false} 
              tickCount={6} 
              tickFormatter={(v) => `${Math.round(v)}h`} 
              width={30} 
              tickMargin={5}
              domain={[0, 200]}
              tick={{ angle: -90, textAnchor: 'middle', fill: '#8a88a8', fontSize: 11, fontFamily: '"Space Mono", monospace' }}
            />
            
            <Tooltip content={<Slide6Tooltip selectedNode={selectedNode} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} isAnimationActive={false} />
            
            <Area 
              type="monotone" 
              dataKey="hours" 
              stroke="url(#slide6GradientStroke)" 
              strokeWidth={3} 
              fill="url(#slide6GradientFill)" 
              isAnimationActive={false} 
              activeDot={false} 
              dot={(props) => <Slide6StaticDot {...props} selectedNode={selectedNode} onSelect={setSelectedNode} />} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==========================================
// SLIDE 9 COMPONENTS & LOGIC
// ==========================================
const Slide9TrailEndDot = (props) => {
  const { cx, cy, payload, index, dataCount, image, status, isFaded, isSelected, onSelect } = props;
  
  if (index !== dataCount - 1 || cx === undefined || cy === undefined) return null; 

  const imgSrc = image || 'https://placehold.co/100x100/1e293b/475569?text=Game';
  const clipId = `clip-end-${payload.gameName.replace(/[^a-zA-Z0-9]/g, '')}-${cx}-${cy}`;
  
  let ringColor = status === 'Completed' ? "#f5a623" : status === 'Ongoing' ? "#3ddc84" : "#ff5c5c";

  const ringRadius = isSelected ? 31 : 12;
  const imgRadius = isSelected ? 27 : 10;
  const imgSize = imgRadius * 2;
  
  return (
    <g 
      style={{ opacity: isFaded ? 0.2 : 1, transition: 'opacity 0.3s ease', cursor: 'pointer', outline: 'none', pointerEvents: 'auto' }}
      onClick={(e) => { 
        if (e && e.stopPropagation) e.stopPropagation(); 
        onSelect(); 
      }}
    >
      <circle cx={cx} cy={cy} r={isSelected ? 32 : 16} fill="transparent" style={{ outline: 'none' }} /> 
      <circle cx={cx} cy={cy} r={ringRadius} fill={ringColor} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', outline: 'none' }} />
      <clipPath id={clipId}><circle cx={cx} cy={cy} r={imgRadius} style={{ transition: 'r 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} /></clipPath>
      <image x={cx - imgRadius} y={cy - imgRadius} width={imgSize} height={imgSize} href={imgSrc} clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" style={{ outline: 'none', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
      
      {isSelected && <circle cx={cx} cy={cy} r={37} fill="none" stroke="#ffffff" strokeWidth={3} />}
    </g>
  );
};

const Slide9Wrapper = ({ streamProgressionLines, progressionDates, gamesTimeline }) => {
  const [selectedGame, setSelectedGame] = useState(null);

  const xDomain = useMemo(() => {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    let minDate, maxDate;

    if (selectedGame) {
      const gameLine = streamProgressionLines.find(l => l.gameName === selectedGame);
      if (gameLine && gameLine.data.length > 0) {
        const timestamps = gameLine.data.map(d => d.date).filter(Boolean);
        if (timestamps.length) {
          minDate = Math.min(...timestamps);
          maxDate = Math.max(...timestamps);
        }
      }
    }
    
    if (!minDate || !maxDate) {
      if (!progressionDates || progressionDates.length === 0) return ['dataMin', 'dataMax'];
      minDate = progressionDates[0];
      maxDate = progressionDates[progressionDates.length - 1];
    }

    return [minDate - ONE_WEEK_MS, maxDate + ONE_WEEK_MS];
  }, [selectedGame, streamProgressionLines, progressionDates]);

  const processedLines = useMemo(() => {
    return streamProgressionLines.map(line => {
      const isSelected = selectedGame === line.gameName;
      if (!isSelected) return line;

      const dataMap = new Map(line.data.map(d => [d.xIndex, d]));
      const minX = Math.min(...line.data.map(d => d.xIndex));
      const maxX = Math.max(...line.data.map(d => d.xIndex));
      
      const continuousData = [];
      let lastKnownHours = 0;
      let lastKnownSecs = 0;

      progressionDates.forEach((date, idx) => {
        if (idx < minX || idx > maxX) return;
        
        if (dataMap.has(idx)) {
          const point = dataMap.get(idx);
          lastKnownHours = point.cumulativeHours;
          lastKnownSecs = point.rawSeconds;
          continuousData.push(point);
        } else {
          continuousData.push({ xIndex: idx, cumulativeHours: lastKnownHours, rawSeconds: lastKnownSecs, date: date, gameName: line.gameName });
        }
      });

      return { ...line, data: continuousData };
    });
  }, [streamProgressionLines, selectedGame, progressionDates]);

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
      <h3 className="text-xs sm:text-sm font-bold text-white/50 uppercase tracking-widest mb-1 drop-shadow-md text-center pointer-events-none shrink-0">Cumulative Session Progression</h3>
      <div className="w-full flex-1 min-h-0 outline-none overflow-visible">
        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
          <LineChart margin={{ top: 35, right: 35, left: 10, bottom: 10 }} style={{ overflow: 'visible' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            
            <XAxis 
              type="number" 
              dataKey="date" 
              scale="time"
              domain={xDomain}
              allowDataOverflow={true} 
              stroke="#8a88a8" 
              axisLine={false} 
              tickLine={false} 
              tickMargin={8}
              dy={20} 
              tickCount={8}
              minTickGap={20}
              tick={{ fill: '#8a88a8', fontSize: 11, fontFamily: '"Space Mono", monospace' }}
              tickFormatter={(val) => {
                if (!val) return '';
                const d = new Date(val);
                return `${d.toLocaleDateString('en-US', { month: 'short' })} '${d.toLocaleDateString('en-US', { year: '2-digit' })}`;
              }} 
            />
            
            <YAxis 
              stroke="#8a88a8" 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(v) => `${Math.round(v)}h`} 
              width={30}
              tickMargin={5}
              tick={{ angle: -90, textAnchor: 'middle', fill: '#8a88a8', fontSize: 11, fontFamily: '"Space Mono", monospace' }}
            />
            
            <Tooltip 
              content={<Slide9Tooltip selectedGame={selectedGame} />} 
              cursor={selectedGame ? { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 } : false} 
              isAnimationActive={false} 
              active={selectedGame ? undefined : false} 
            />

            {processedLines?.map((line, idx) => {
              const isSelected = selectedGame === line.gameName;
              const hasSelection = selectedGame !== null;
              const isDimmed = hasSelection && !isSelected;
              
              const gameInfo = gamesTimeline?.find(g => g.name === line.gameName);
              const imageUrl = line.image || gameInfo?.image;
              const gameStatus = line.status || gameInfo?.status;

              const tooltipHandling = isSelected ? "hover" : "none";

              return (
                <Line 
                  key={idx}
                  data={line.data}
                  type="monotone" 
                  dataKey="cumulativeHours" 
                  stroke={line.color}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeOpacity={isDimmed ? 0.1 : 1}
                  tooltipType={tooltipHandling}
                  activeDot={false}
                  dot={(props) => (
                    <Slide9TrailEndDot 
                      {...props} 
                      dataCount={line.data.length} 
                      image={imageUrl} 
                      status={gameStatus} 
                      isFaded={isDimmed} 
                      isSelected={isSelected}
                      onSelect={() => setSelectedGame(isSelected ? null : line.gameName)} 
                    />
                  )}
                  style={{ pointerEvents: 'none' }}
                  isAnimationActive={false}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==========================================
// MASTER EXPORT
// ==========================================
export const getCard3Slide = (index, data) => {
  const { latestBgImage, mostRecentGame, timeSinceLastStream, gamesTimeline, streamProgressionLines, progressionDates } = data;
  switch (index) {
    case 0: return (
      <div className="slide-container justify-end outline-none">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
        <div className="latest-bg"><CrossfadeImage src={latestBgImage} className="w-full h-full" imgClassName="object-cover" duration={700} /></div>
        <div className="latest-content">
          <div className="stat-number drop-shadow-xl latest-title">{mostRecentGame?.game_name || '—'}</div>
          <div className="stat-sub latest-sub-3">{mostRecentGame?.latestRunName || ''}</div>
          <div className="stat-sub latest-sub-1">Last: <span className="latest-sub-time">{timeSinceLastStream}</span></div>
          <div className="stat-sub latest-sub-2">{mostRecentGame?.lastStreamTimestampRaw ? `On ${mostRecentGame.lastStreamTimestampRaw}` : 'Unknown'}</div>
        </div>
      </div>
    );
    case 1: return <Slide6Wrapper gamesTimeline={gamesTimeline} />;
    case 2: return <Slide9Wrapper streamProgressionLines={streamProgressionLines} progressionDates={progressionDates} gamesTimeline={gamesTimeline} />;
    default: return <div className="slide-container flex items-center justify-center bg-black/60"><span className="text-3xl font-bold text-[#e8c87a] uppercase tracking-widest drop-shadow-md">Placeholder</span></div>;
  }
};