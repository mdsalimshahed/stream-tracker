import React from 'react';

// Expanded ranges for all sliders
export const RangeControl = ({ label, value, min, max, step = 1, onChange, disabled = false }) => (
  <div className={`space-y-1 ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex justify-between text-xs text-white/50">
      <span>{label}</span>
      <span className="font-mono text-white/80">{typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      disabled={disabled}
      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);

export const ColorPicker = ({ label, value, onChange }) => {
  const p = value.match(/[\d.]+/g) || [255,255,255,1];
  const hex = `#${((1 << 24) + (Number(p[0]) << 16) + (Number(p[1]) << 8) + Number(p[2])).toString(16).slice(1)}`;
  const alpha = Number(p[3]) || 1;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-12 text-white/50">{label}</span>
      <input type="color" value={hex} onChange={e => { const r = parseInt(e.target.value.slice(1,3),16), g = parseInt(e.target.value.slice(3,5),16), b = parseInt(e.target.value.slice(5,7),16); onChange(`rgba(${r}, ${g}, ${b}, ${alpha})`); }} className="w-8 h-8 rounded cursor-pointer" />
      <input type="range" min="0" max="1" step="0.01" value={alpha} onChange={e => onChange(`rgba(${p[0]}, ${p[1]}, ${p[2]}, ${e.target.value})`)} className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer" />
      <span className="text-xs font-mono w-10 text-right">{Math.round(alpha*100)}%</span>
    </div>
  );
};

// ColorOverride remains the same, but we'll adapt to new element names
export const ColorOverride = ({ title, element, config, toggle, onChange }) => {
  const a = config.manualColors[element];
  return (
    <div className="pt-4 border-t border-white/10">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium">{title}</span>
        <button onClick={toggle} className={`text-xs px-3 py-1 rounded-full transition ${a ? 'bg-amber-600' : 'bg-white/10'}`}>
          {a ? 'Manual' : 'Auto'}
        </button>
      </div>
      {a && (
        <div className="space-y-3 animate-in slide-in-from-top-2">
          <ColorPicker label="Fill" value={config.colors[`${element}Fill`]} onChange={v => onChange(element, 'Fill', v)} />
          <ColorPicker label="Stroke" value={config.colors[`${element}Stroke`]} onChange={v => onChange(element, 'Stroke', v)} />
          <button
            onClick={() => {
              const currentFill = config.colors[`${element}Fill`];
              const currentStroke = config.colors[`${element}Stroke`];
              onChange(element, 'Fill', currentStroke);
              onChange(element, 'Stroke', currentFill);
            }}
            className="w-full mt-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20"
          >
            Swap Fill & Stroke
          </button>
        </div>
      )}
    </div>
  );
};