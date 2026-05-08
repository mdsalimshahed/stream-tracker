import React, { useState, useEffect, useRef } from 'react';

export const RangeControl = ({ label, description, value, min, max, step = 1, onChange, disabled = false }) => (
  <div className={`space-y-1 ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex justify-between text-xs text-white/50 mb-1">
      <div>
        <span className="block font-medium text-white">{label}</span>
        {description && <span className="block text-white/40 mt-0.5">{description}</span>}
      </div>
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
      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-inner"
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

export const ColorOverride = ({ title, element, config, toggle, onChange }) => {
  const a = config.manualColors[element];
  return (
    <div className="pt-4 border-t border-white/10">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium">{title}</span>
        <button onClick={toggle} className={`text-xs px-3 py-1 rounded-full transition shadow ${a ? 'bg-amber-600' : 'bg-white/10 hover:bg-white/20'}`}>
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
            className="w-full mt-2 py-1.5 text-xs bg-white/10 rounded-md hover:bg-white/20 transition shadow-inner"
          >
            Swap Fill & Stroke
          </button>
        </div>
      )}
    </div>
  );
};

export const CrossfadeImage = ({ src, alt, className, imgClassName, style }) => {
  const [images, setImages] = useState([src, src]);
  const [activeIndex, setActiveIndex] = useState(1);
  const prevSrcRef = useRef(src);

  useEffect(() => {
    if (!src || src === prevSrcRef.current) return;

    let isMounted = true;

    // Load the image in memory FIRST before trying to fade to it
    const img = new Image();
    const handleLoadOrError = () => {
      if (!isMounted) return;
      prevSrcRef.current = src;
      setActiveIndex(prev => {
        const nextIndex = prev === 0 ? 1 : 0;
        setImages(currImages => {
          const newArr = [...currImages];
          newArr[nextIndex] = src;
          return newArr;
        });
        return nextIndex;
      });
    };

    img.onload = handleLoadOrError;
    img.onerror = handleLoadOrError;
    img.src = src;

    return () => {
      isMounted = false;
    };
  }, [src]);

  const imgStyle = {
    transition: 'opacity 1s ease-in-out, transform 1s ease-in-out'
  };

  return (
    <div className={`relative overflow-hidden ${className || ''}`} style={style}>
      <img 
        src={images[0] || ''} 
        alt={alt || ''} 
        style={imgStyle}
        className={`absolute inset-0 w-full h-full ${activeIndex === 0 ? 'opacity-100' : 'opacity-0'} ${imgClassName || ''}`} 
      />
      <img 
        src={images[1] || ''} 
        alt={alt || ''} 
        style={imgStyle}
        className={`absolute inset-0 w-full h-full ${activeIndex === 1 ? 'opacity-100' : 'opacity-0'} ${imgClassName || ''}`} 
      />
    </div>
  );
};