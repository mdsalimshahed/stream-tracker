// src/components/insights/Charts.jsx
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis, 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from 'recharts';
import { PALETTE } from './utils';

const C_GRID = 'rgba(255,255,255,0.05)';
const C_TEXT = '#8a88a8';

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', fontFamily: '"Space Mono", monospace', fontSize: '11px', color: '#fff' }}>
        <div style={{ marginBottom: '4px', color: C_TEXT }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: p.color || p.fill, borderRadius: '50%' }}></span>
            {p.name}: {formatter ? formatter(p.value, p) : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const StatusPie = ({ data }) => (
  <ResponsiveContainer width="100%" height={260}>
    <PieChart>
      <Pie data={data} innerRadius="65%" outerRadius="90%" paddingAngle={2} dataKey="value" stroke="none">
        <Cell fill="#6cfacc" /> <Cell fill="#f87171" /> <Cell fill="#fac86c" />
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily: '"Space Mono", monospace', fontSize: '11px', color: C_TEXT }} />
    </PieChart>
  </ResponsiveContainer>
);

export const BasicBar = ({ data, dataKey, xKey, color, isVertical, formatTooltip, colors }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout={isVertical ? 'vertical' : 'horizontal'} margin={{ left: isVertical ? 50 : 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={C_GRID} horizontal={!isVertical} vertical={isVertical} />
      <XAxis type={isVertical ? 'number' : 'category'} dataKey={isVertical ? undefined : xKey} stroke={C_TEXT} fontSize={10} fontFamily='"Space Mono"' tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
      <YAxis type={isVertical ? 'category' : 'number'} dataKey={isVertical ? xKey : undefined} stroke={C_TEXT} fontSize={10} fontFamily='"Space Mono"' tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} width={isVertical ? 120 : 40} />
      <Tooltip content={<CustomTooltip formatter={formatTooltip} />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
      <Bar dataKey={dataKey} fill={color || PALETTE[0]} radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
        {colors && data.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const StackedBar = ({ data, keys, colors }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" stackOffset="expand" margin={{ left: 50 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={C_GRID} vertical={true} horizontal={false} />
      <XAxis type="number" hide />
      <YAxis type="category" dataKey="name" stroke={C_TEXT} fontSize={10} fontFamily='"Space Mono"' tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} width={100} />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily: '"Space Mono", monospace', fontSize: '11px', color: C_TEXT }} />
      {keys.map((k, i) => (
        <Bar key={k} dataKey={k} stackId="a" fill={colors[i]} radius={i === 0 ? [4, 0, 0, 4] : i === keys.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
      ))}
    </BarChart>
  </ResponsiveContainer>
);

export const SmoothLine = ({ data, dataKey, xKey, color, formatTooltip, fill }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke={C_GRID} />
      <XAxis dataKey={xKey} stroke={C_TEXT} fontSize={10} fontFamily='"Space Mono"' tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
      <YAxis stroke={C_TEXT} fontSize={10} fontFamily='"Space Mono"' tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
      <Tooltip content={<CustomTooltip formatter={formatTooltip} />} />
      <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={fill ? false : { r: 2, fill: color, strokeWidth: 0 }} activeDot={{ r: 4 }} />
    </LineChart>
  </ResponsiveContainer>
);

export const MultiLine = ({ datasets }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart margin={{ bottom: 20 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={C_GRID} />
      <XAxis type="number" dataKey="x" allowDuplicatedCategory={false} stroke={C_TEXT} fontSize={10} fontFamily='"Space Mono"' tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
      <YAxis stroke={C_TEXT} fontSize={10} fontFamily='"Space Mono"' tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontFamily: '"Space Mono", monospace', fontSize: '11px', color: C_TEXT, position: 'absolute', bottom: 0 }} />
      {datasets.map((s, i) => (
        <Line key={s.label} data={s.data} type="monotone" dataKey="y" name={s.label} stroke={s.borderColor} strokeWidth={2} dot={{ r: 2, strokeWidth: 0 }} />
      ))}
    </LineChart>
  </ResponsiveContainer>
);

export const CustomScatter = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <ScatterChart>
      <CartesianGrid strokeDasharray="3 3" stroke={C_GRID} />
      <XAxis type="number" dataKey="x" name="Streams" stroke={C_TEXT} fontSize={10} fontFamily='"Space Mono"' tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
      <YAxis type="number" dataKey="y" name="Avg min" stroke={C_TEXT} fontSize={10} fontFamily='"Space Mono"' tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
      <ZAxis type="category" dataKey="label" name="Game" />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip formatter={(val, p) => p.name === 'Avg min' ? `${val}m avg` : `${val} streams`} />} />
      <Scatter data={data}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.status === 'Completed' ? '#6cfacc' : entry.status === 'Ongoing' ? '#fac86c' : '#f87171'} />
        ))}
      </Scatter>
    </ScatterChart>
  </ResponsiveContainer>
);

export const RadarDNA = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
      <PolarGrid stroke={C_GRID} />
      <PolarAngleAxis dataKey="subject" tick={{ fill: C_TEXT, fontSize: 10, fontFamily: '"Space Mono"' }} />
      <Radar name="Hours" dataKey="A" stroke="#7c6cfa" fill="#7c6cfa" fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: '#7c6cfa' }} />
      <Tooltip content={<CustomTooltip formatter={v => `${v}h`} />} />
    </RadarChart>
  </ResponsiveContainer>
);