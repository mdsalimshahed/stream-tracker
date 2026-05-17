// src/components/stats/slides/card3/Card3Slide2.jsx
import React, { useState, useRef, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Label } from 'recharts';
import { formatFullTime } from '../SlideHelpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const statusColor = (status) =>
  status === 'Completed' ? "#f5a623" : status === 'Ongoing' ? "#3ddc84" : "#ff5c5c";

// ---------------------------------------------------------------------------
// Tooltip bubble — positioned manually, no Recharts involvement
// ---------------------------------------------------------------------------
const TooltipBubble = ({ tooltipData, pos }) => {
  if (!tooltipData || !pos) return null;
  const d = new Date(tooltipData.date);
  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -130%)',
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

// ---------------------------------------------------------------------------
// End-dot SVG element rendered as a Recharts dot prop
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Constants that must match LineChart margin + axis sizes exactly
// ---------------------------------------------------------------------------
const MARGIN      = { top: 35, right: 40, left: 15, bottom: 15 };
const YAXIS_WIDTH = 45;
const XAXIS_HEIGHT = 35;
const YAXIS_PAD   = { top: 35, bottom: 10 };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
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

  // Derived x-domain
  const xDomain = (() => {
    if (!processedProgressionLines.length) return ['dataMin', 'dataMax'];
    if (selectedGame) {
      const g = processedProgressionLines.find(l => l.gameName === selectedGame);
      if (g) return g.minX === g.maxX ? [g.minX - 1, g.maxX + 1] : [g.minX, g.maxX];
    }
    return ['dataMin', 'dataMax'];
  })();

  const chartPadding = selectedGame ? { left: 32, right: 32 } : { left: 16, right: 16 };

  // ------------------------------------------------------------------
  // Convert data coords to container-relative pixels.
  // We derive the plot area purely from constants — no Recharts internals.
  // ------------------------------------------------------------------
  const makeConverters = useCallback((rectW, rectH) => {
    const plotLeft   = MARGIN.left + YAXIS_WIDTH;
    const plotTop    = MARGIN.top  + YAXIS_PAD.top;   // account for yAxis top padding
    const plotRight  = rectW - MARGIN.right;
    const plotBottom = rectH - MARGIN.bottom - XAXIS_HEIGHT - YAXIS_PAD.bottom;
    const plotW = plotRight  - plotLeft;
    const plotH = plotBottom - plotTop;

    const allX = processedProgressionLines.flatMap(l => l.data.map(p => p.xIndex));
    const rawXMin = xDomain[0] === 'dataMin' ? (Math.min(...allX) || 0) : xDomain[0];
    const rawXMax = xDomain[1] === 'dataMax' ? (Math.max(...allX) || 1) : xDomain[1];
    const yMin = 0;
    const yMax = progressionYMax || 1;

    const padL = chartPadding?.left  ?? 0;
    const padR = chartPadding?.right ?? 0;
    const innerW = plotW - padL - padR;

    const toPixelX = (xVal) => plotLeft + padL + ((xVal - rawXMin) / (rawXMax - rawXMin || 1)) * innerW;
    const toPixelY = (yVal) => plotBottom - ((yVal - yMin) / (yMax - yMin || 1)) * plotH;

    return { toPixelX, toPixelY };
  }, [processedProgressionLines, xDomain, chartPadding, progressionYMax]);

  // ------------------------------------------------------------------
  // Mouse move
  // ------------------------------------------------------------------
  const handleMouseMove = useCallback((e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const { toPixelX, toPixelY } = makeConverters(rect.width, rect.height);

    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (!selectedGame) {
      // Snap tooltip to nearest end dot within a radius
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
        setTooltipData(best);
        setTooltipPos({ x: toPixelX(best.xIndex), y: toPixelY(best.cumulativeHours) });
      } else {
        setTooltipData(null);
        setTooltipPos(null);
      }
    } else {
      // Follow cursor along the selected game's trail
      const line = processedProgressionLines.find(l => l.gameName === selectedGame);
      if (!line?.data?.length) { setTooltipData(null); return; }

      let best = null;
      let bestDist = Infinity;
      for (const pt of line.data) {
        const dist = Math.abs(mx - toPixelX(pt.xIndex));
        if (dist < bestDist) { bestDist = dist; best = pt; }
      }
      if (best) {
        setTooltipData({ ...best, gameName: line.gameName, color: line.color });
        setTooltipPos({ x: toPixelX(best.xIndex), y: toPixelY(best.cumulativeHours) });
      }
    }
  }, [selectedGame, processedProgressionLines, makeConverters]);

  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
    setTooltipPos(null);
  }, []);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col bg-black/40 outline-none select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag !== 'circle' && tag !== 'image') {
          setSelectedGame(null);
          setTooltipData(null);
          setTooltipPos(null);
        }
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .recharts-wrapper, .recharts-surface, .recharts-responsive-container, svg { overflow: visible !important; outline: none !important; }
        *:focus { outline: none !important; }
      `}} />

      <div className="w-full flex-1 min-h-0 relative overflow-visible">
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
              domain={[0, progressionYMax]}
              ticks={progressionYTicks}
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

            {/* Trail lines + end dots — all in one chart, zero offset risk */}
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
                        onSelect={() => setSelectedGame(isSelected ? null : line.gameName)}
                      />
                    );
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>

        {/* Manual cursor line when a game is selected */}
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

        {/* Manually positioned tooltip bubble */}
        <TooltipBubble tooltipData={tooltipData} pos={tooltipPos} />
      </div>
    </div>
  );
}
