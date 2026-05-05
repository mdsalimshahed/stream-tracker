import React from 'react';

export const RangeControl = ({ label, value, min, max, onChange }) => (
  <label className="block group shrink-0 font-arial">
    <div className="flex justify-between text-[13px] text-slate-500 font-bold mb-4 uppercase group-hover:text-white transition-colors">
      <span>{label}</span> 
      <span className="text-blue-500">{value}PX</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2.5 bg-slate-950 rounded-full appearance-none cursor-pointer accent-blue-600 ring-1 ring-white/10 shadow-inner" />
  </label>
);

export const ColorOverride = ({ title, element, config, toggle, onChange }) => {
  const k = element === 'stream' ? 'streamCount' : element, a = config.manualColors[k];
  return (
    <div className="space-y-8 pt-10 border-t border-slate-800 shrink-0 font-arial">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white uppercase">{title}</span>
        <button onClick={toggle} className={`text-[11px] font-bold px-5 py-2 rounded transition-all shadow-2xl uppercase ${a ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
          {a ? 'MANUAL' : 'AUTO'}
        </button>
      </div>
      {a && ( 
        <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-top-4"> 
          <ColorPicker label="Fill Tone" value={config.colors[`${element}Fill`]} onChange={v => onChange(element, 'Fill', v)} /> 
          <ColorPicker label="Stroke Tone" value={config.colors[`${element}Stroke`]} onChange={v => onChange(element, 'Stroke', v)} /> 
        </div> 
      )}
    </div>
  );
};

export const ColorPicker = ({ label, value, onChange }) => {
  const p = value.match(/[\d.]+/g) || [255, 255, 255, 1];
  const h = `#${( (1 << 24) + (Number(p[0]) << 16) + (Number(p[1]) << 8) + Number(p[2]) ).toString(16).slice(1)}`;
  const al = p[3] || 1;
  
  return (
    <div className="flex flex-col gap-5 p-6 bg-slate-950 border border-slate-800 shadow-2xl font-arial">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-8">
        <input type="color" value={h} onChange={e => { const r_ = parseInt(e.target.value.slice(1,3), 16), g_ = parseInt(e.target.value.slice(3,5), 16), b_ = parseInt(e.target.value.slice(5,7), 16); onChange(`rgba(${r_}, ${g_}, ${b_}, ${al})`); }} className="h-12 w-20 bg-transparent border-none cursor-pointer hover:scale-105 transition-transform" />
        <div className="flex-1"><input type="range" min="0" max="1" step="0.01" value={al} onChange={e => onChange(`rgba(${p[0]}, ${p[1]}, ${p[2]}, ${e.target.value})`)} className="w-full h-1.5 bg-slate-800 cursor-pointer accent-white" /></div>
        <span className="text-sm text-white font-mono font-bold w-12 text-right">{Math.round(al * 100)}%</span>
      </div>
    </div>
  );
};