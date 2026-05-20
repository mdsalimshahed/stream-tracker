// src/components/stats/slides/card3/Card3Slide2.jsx
import React, { useState, useRef, useCallback, memo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Label } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const statusColor = (status) =>
  status === 'Completed' ? "#f5a623" : status === 'Ongoing' ? "#3ddc84" : "#ff5c5c";

const TooltipBubble = ({ tooltipData, pos }) => {
  if (!tooltipData || !pos) return null;
  const d = new Date(tooltipData.date);
  
  let xTrans = '-50%';
  if (pos.x < 120) xTrans = '0%';
  else if (pos.boundsWidth && pos.x > pos.boundsWidth - 120) xTrans = '-100%';
  
  const isNearTop = pos.y < 100;
  const transform = `translate(${xTrans}, ${isNearTop ? '20px' : '-130%'})`;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <div className="bg-black/95 border border-white/20 p-3 rounded-lg text-xs font-mono text-white shadow-2xl whitespace-nowrap">
        <div className="text-white font-bold mb-1 text-sm">{tooltipData.gameName}</div>
        <div className="text-white/50 mb-2" style={{ fontSize: '10px' }}>
          {getOrdinal(d.getDate())} {d.toLocaleDateString('en-US', { month: 'long' })} {d.getFullYear()}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tooltipData.color }} />
          <span className="font-bold text-[#e8c87a]">
            {formatFullTime(tooltipData.rawSeconds ?? Math.round(tooltipData.cumulativeHours * 3600))}
          </span>
        </div>
      </div>
    </div>
  );
};

const TrailEndDot = ({ cx, cy, payload, image, status, isFaded, isSelected, onSelect }) => {
  if (cx == null || cy == null) return null;
  const clipId = `clip-${(payload?.gameName ?? 'x').replace(/[^a-zA-Z0-9]/g, '')}-${Math.round(cx)}-${Math.round(cy)}`;
  const ring  = statusColor(status);
  const ringR = isSelected ? 31 : 12;
  const imgR  = isSelected ? 27 : 10;
  return (
    <g
      style={{ opacity: isFaded ? 0.2 : 1, transition: 'opacity 0.3s ease', cursor: 'pointer', pointerEvents: 'all' }}
      onClick={(e) => { e?.stopPropagation(); onSelect(); }}
    >
      <circle cx={cx} cy={cy} r={isSelected ? 32 : 16} fill="transparent" />
      <circle cx={cx} cy={cy} r={ringR} fill={ring} style={{ transition: 'r 0.3s cubic-bezier(0.175,0.885,0.32,1.275)' }} />
      <clipPath id={clipId}><circle cx={cx} cy={cy} r={imgR} /></clipPath>
      <image
        x={cx - imgR} y={cy - imgR} width={imgR * 2} height={imgR * 2}
        href={image || 'https://placehold.co/100x100'}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
        style={{ transition: 'all 0.3s' }}
      />
    </g>
  );
};

const MARGIN      = { top: 35, right: 40, left: 15, bottom: 15 };
const YAXIS_WIDTH = 45;
const XAXIS_HEIGHT = 35;
const YAXIS_PAD   = { top: 35, bottom: 10 };

// PERFORMANCE OPTIMIZATION: Memoize the heavy Recharts layer so it NEVER re-renders 
// on simple mouse movement / tooltip updates. It only re-renders when you click to select a new game.
const StaticChartLayer = memo(({ 
  processedProgressionLines, gamesTimeline, progressionDates, selectedGame, 
  xDomain, chartPadding, dynamicYMax, dynamicYTicks, setSelectedGame 
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }}>
      <LineChart margin={MARGIN} style={{ overflow: 'visible' }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

        <XAxis
          type="number"
          dataKey="xIndex"
          domain={xDomain}
          padding={chartPadding}
          allowDataOverflow
          allowDecimals={false}
          stroke="#8a88a8"
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          height={XAXIS_HEIGHT}
          minTickGap={5}
          tick={{ fill: '#8a88a8', fontSize: 10 }}
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

        <YAxis
          domain={[0, dynamicYMax]}
          ticks={dynamicYTicks}
          allowDataOverflow={true} 
          stroke="#8a88a8"
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${Math.round(v)}h`}
          width={YAXIS_WIDTH}
          padding={YAXIS_PAD}
          tick={{ angle: -90, textAnchor: 'middle', dx: -10, fill: '#8a88a8', fontSize: 10 }}
        >
          <Label value="Playtime" angle={-90} position="insideLeft" style={{ fill: '#8a88a8', fontSize: 11, fontWeight: 'bold', textAnchor: 'middle' }} />
        </YAxis>

        {processedProgressionLines.map((line, idx) => {
          const isSelected = selectedGame === line.gameName;
          const isDimmed   = selectedGame !== null && !isSelected;
          const gameInfo   = gamesTimeline.find(g => g.name === line.gameName);
          return (
            <Line
              key={`line-${idx}`}
              data={line.data}
              type="monotone"
              dataKey="cumulativeHours"
              stroke={line.color}
              strokeWidth={isSelected ? 3 : 1.5}
              strokeOpacity={isDimmed ? 0.1 : 1}
              activeDot={false}
              isAnimationActive={false}
              dot={(props) => {
                if (props.index !== line.data.length - 1) return null;
                return (
                  <TrailEndDot
                    key={`dot-${idx}`}
                    cx={props.cx}
                    cy={props.cy}
                    payload={{ gameName: line.gameName }}
                    image={line.image || gameInfo?.image}
                    status={line.status || gameInfo?.status}
                    isFaded={selectedGame !== null && !isSelected}
                    isSelected={isSelected}
                    onSelect={() => {
                      setSelectedGame(isSelected ? null : line.gameName);
                    }}
                  />
                );
              }}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
});

export default function Card3Slide2({ data }) {
  const {
    processedProgressionLines = [],
    progressionDates = [],
    progressionYMax,
    progressionYTicks,
    gamesTimeline = [],
  } = data;

  const [selectedGame, setSelectedGame] = useState(null);
  const [tooltipData,  setTooltipData]  = useState(null);
  const [tooltipPos,   setTooltipPos]   = useState(null);
  
  const containerRef = useRef(null);
  const activeHoverRef = useRef(null);
  const lastComputedXIndexRef = useRef(null);

  const xDomain = (() => {
    if (!processedProgressionLines.length) return ['dataMin', 'dataMax'];
    if (selectedGame) {
      const g = processedProgressionLines.find(l => l.gameName === selectedGame);
      if (g) return g.minX === g.maxX ? [g.minX - 1, g.maxX + 1] : [g.minX, g.maxX];
    }
    return ['dataMin', 'dataMax'];
  })();

  const chartPadding = selectedGame ? { left: 32, right: 32 } : { left: 16, right: 16 };

  const { dynamicYMax, dynamicYTicks } = (() => {
    if (selectedGame) {
      const g = processedProgressionLines.find(l => l.gameName === selectedGame);
      if (g && g.data && g.data.length > 0) {
        const peakY = Math.max(...g.data.map(d => d.cumulativeHours));
        const rawTarget = peakY * 1.25;
        
        if (rawTarget <= 0) return { dynamicYMax: 1, dynamicYTicks: [0, 1] };
        
        const roughStep = Math.max(0.1, rawTarget / 4);
        const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const norm = roughStep / mag;
        let clean = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
        let step = Math.max(0.1, clean * mag);
        
        let newMax = Math.ceil(rawTarget / step) * step;
        let newTicks = [];
        for (let i = step; i <= newMax; i += step) newTicks.push(i);
        
        while (newTicks.length > 4) {
           step *= 2;
           newMax = Math.ceil(rawTarget / step) * step;
           newTicks = [];
           for (let i = step; i <= newMax; i += step) newTicks.push(i);
        }
        
        return { dynamicYMax: newMax, dynamicYTicks: newTicks };
      }
    }
    return { dynamicYMax: progressionYMax, dynamicYTicks: progressionYTicks };
  })();

  const makeConverters = useCallback((rectW, rectH) => {
    const plotLeft   = MARGIN.left + YAXIS_WIDTH;
    const plotTop    = MARGIN.top  + YAXIS_PAD.top; 
    const plotRight  = rectW - MARGIN.right;
    const plotBottom = rectH - MARGIN.bottom - XAXIS_HEIGHT - YAXIS_PAD.bottom;
    const plotW = plotRight  - plotLeft;
    const plotH = plotBottom - plotTop;

    const allX = processedProgressionLines.flatMap(l => l.data.map(p => p.xIndex));
    const rawXMin = xDomain[0] === 'dataMin' ? (Math.min(...allX) || 0) : xDomain[0];
    const rawXMax = xDomain[1] === 'dataMax' ? (Math.max(...allX) || 1) : xDomain[1];
    const yMin = 0;
    const yMax = dynamicYMax || 1;

    const padL = chartPadding?.left  ?? 0;
    const padR = chartPadding?.right ?? 0;
    const innerW = plotW - padL - padR;

    const toPixelX = (xVal) => plotLeft + padL + ((xVal - rawXMin) / (rawXMax - rawXMin || 1)) * innerW;
    const toPixelY = (yVal) => plotBottom - ((yVal - yMin) / (yMax - yMin || 1)) * plotH;

    return { toPixelX, toPixelY, plotLeft, innerW, padL, rawXMin, rawXMax };
  }, [processedProgressionLines, xDomain, chartPadding, dynamicYMax]);

  const handleMouseMove = useCallback((e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const { toPixelX, toPixelY, plotLeft, innerW, padL, rawXMin, rawXMax } = makeConverters(rect.width, rect.height);

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (!selectedGame) {
      const SNAP_R = 22;
      let best = null;
      let bestDist = Infinity;
      for (const line of processedProgressionLines) {
        const ed = line.endDot;
        if (!ed) continue;
        const px = toPixelX(ed.xIndex);
        const py = toPixelY(ed.cumulativeHours);
        const dist = Math.hypot(mx - px, my - py);
        if (dist < SNAP_R && dist < bestDist) {
          bestDist = dist;
          best = { ...ed, gameName: line.gameName, color: line.color };
        }
      }
      if (best) {
        const pointId = `unselected-${best.gameName}`;
        if (activeHoverRef.current !== pointId) {
          activeHoverRef.current = pointId;
          setTooltipData(best);
          setTooltipPos({ x: toPixelX(best.xIndex), y: toPixelY(best.cumulativeHours), boundsWidth: rect.width });
        }
      } else {
        if (activeHoverRef.current !== null) {
          activeHoverRef.current = null;
          setTooltipData(null);
          setTooltipPos(null);
        }
      }
    } else {
      const line = processedProgressionLines.find(l => l.gameName === selectedGame);
      if (!line?.data?.length) { 
        if (activeHoverRef.current !== null) {
          activeHoverRef.current = null;
          setTooltipData(null); 
          setTooltipPos(null);
        }
        return; 
      }

      const rawX = rawXMin + ((mx - plotLeft - padL) / (innerW || 1)) * (rawXMax - rawXMin);
      const hoveredXIndex = Math.round(rawX);

      if (lastComputedXIndexRef.current === hoveredXIndex) return;
      lastComputedXIndexRef.current = hoveredXIndex;

      let nearestPoint = null;
      let minXDist = Infinity;

      for (let i = 0; i < line.data.length; i++) {
        const pt = line.data[i];
        const isActualStream = i === 0 || pt.rawSeconds > line.data[i - 1].rawSeconds;
        
        if (isActualStream) {
          const dist = Math.abs(pt.xIndex - hoveredXIndex);
          if (dist < minXDist) {
            minXDist = dist;
            nearestPoint = pt;
          }
        }
      }

      if (nearestPoint) {
        const pointId = `selected-${nearestPoint.xIndex}`;
        if (activeHoverRef.current !== pointId) {
          activeHoverRef.current = pointId;
          setTooltipData({ ...nearestPoint, gameName: line.gameName, color: line.color });
          setTooltipPos({ x: toPixelX(nearestPoint.xIndex), y: toPixelY(nearestPoint.cumulativeHours), boundsWidth: rect.width });
        }
      }
    }
  }, [selectedGame, processedProgressionLines, makeConverters]);

  const handleMouseLeave = useCallback(() => {
    activeHoverRef.current = null;
    lastComputedXIndexRef.current = null;
    setTooltipData(null);
    setTooltipPos(null);
  }, []);

  // Update selected game logic specifically inside the static layer
  const handleSelectGame = useCallback((gameName) => {
    activeHoverRef.current = null;
    lastComputedXIndexRef.current = null;
    setSelectedGame(gameName);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col bg-black/40 outline-none select-none overflow-visible"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag !== 'circle' && tag !== 'image') {
          activeHoverRef.current = null;
          lastComputedXIndexRef.current = null;
          setSelectedGame(null);
          setTooltipData(null);
          setTooltipPos(null);
        }
      }}
    >
      <div className="w-full flex-1 min-h-0 relative overflow-visible">
        
        <StaticChartLayer 
          processedProgressionLines={processedProgressionLines}
          gamesTimeline={gamesTimeline}
          progressionDates={progressionDates}
          selectedGame={selectedGame}
          xDomain={xDomain}
          chartPadding={chartPadding}
          dynamicYMax={dynamicYMax}
          dynamicYTicks={dynamicYTicks}
          setSelectedGame={handleSelectGame}
        />

        {selectedGame && tooltipPos && (
          <div
            style={{
              position: 'absolute',
              left: tooltipPos.x,
              top: MARGIN.top,
              width: 1,
              bottom: MARGIN.bottom + XAXIS_HEIGHT,
              background: 'rgba(255,255,255,0.15)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}

        <TooltipBubble tooltipData={tooltipData} pos={tooltipPos} />
      </div>
    </div>
  );
}