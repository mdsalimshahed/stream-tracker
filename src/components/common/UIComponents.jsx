// src/components/common/UIComponents.jsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

export const RangeControl = ({ label, description, value, min, max, step = 1, onChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let val = parseFloat(inputValue);
    if (isNaN(val)) {
      setInputValue(value);
      return;
    }
    if (val < min) val = min;
    if (val > max) val = max;
    onChange(val);
    setInputValue(val);
  };

  return (
    <div className={`space-y-1 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center text-xs text-white/50 mb-1 gap-2">
        <div>
          <span className="block font-medium text-white">{label}</span>
          {description && <span className="block text-white/40 mt-0.5">{description}</span>}
        </div>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          className="w-16 bg-black/60 border border-white/10 rounded px-2 py-1 text-right font-mono text-white/80 focus:outline-none focus:border-blue-500 shadow-inner shrink-0"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          onChange(val);
          setInputValue(val);
        }}
        disabled={disabled}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-inner touch-pan-y"
      />
    </div>
  );
};

export const ColorPicker = ({ label, value, onChange }) => {
  const p = value.match(/[\d.]+/g) || [255,255,255,1];
  const hex = `#${((1 << 24) + (Number(p[0]) << 16) + (Number(p[1]) << 8) + Number(p[2])).toString(16).slice(1)}`;
  const alpha = Number(p[3]) || 1;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-12 text-white/50 shrink-0">{label}</span>
      <input 
        type="color" 
        value={hex} 
        onChange={e => { 
          const r = parseInt(e.target.value.slice(1,3),16), g = parseInt(e.target.value.slice(3,5),16), b = parseInt(e.target.value.slice(5,7),16); 
          onChange(`rgba(${r}, ${g}, ${b}, ${alpha})`); 
        }} 
        className="w-8 h-8 rounded cursor-pointer shrink-0" 
      />
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01" 
        value={alpha} 
        onChange={e => onChange(`rgba(${p[0]}, ${p[1]}, ${p[2]}, ${e.target.value})`)} 
        className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer touch-pan-y" 
      />
      <span className="text-xs font-mono w-10 text-right shrink-0">{Math.round(alpha*100)}%</span>
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

export const CrossfadeImage = ({ src, alt, className, imgClassName, style, duration = 700 }) => {
  const [images, setImages] = useState(src ? [{ id: Date.now(), src }] : []);

  useEffect(() => {
    if (!src) return;
    
    let isMounted = true;
    
    // Preload the image in the background
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      if (isMounted) {
        setImages(prev => {
          // If the target image is already on top, do nothing
          if (prev.length > 0 && prev[prev.length - 1].src === src) return prev;
          
          // Keep the previous image for the crossfade base, and add the new one on top
          if (prev.length === 0) return [{ id: Date.now(), src }];
          return [prev[prev.length - 1], { id: Date.now(), src }];
        });
      }
    };

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className || ''}`} style={style}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes smoothFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}} />
      {images.map((imgObj, i) => {
        const isTopLayer = i === images.length - 1;
        return (
          <img
            key={imgObj.id}
            src={imgObj.src}
            alt={alt || ''}
            style={{
              animation: isTopLayer && images.length > 1 ? `smoothFadeIn ${duration}ms ease-in-out forwards` : 'none',
              zIndex: i,
            }}
            className={`absolute inset-0 w-full h-full ${imgClassName || ''}`}
            decoding="async" 
            loading="eager" // We can safely use eager now because the image is already downloaded and cached
          />
        );
      })}
    </div>
  );
};

// --- CUSTOM FLIP-ANIMATED MASONRY LAYOUT ---
export const MasonryLayout = ({ items, columnWidth, gap, renderItem, getItemId, enableAnimations = true }) => {
  const containerRef = useRef(null);
  const [colCount, setColCount] = useState(0);

  const prevItems = useRef(items);
  const prevPositions = useRef({});

  useEffect(() => {
    const updateCols = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const newCols = Math.max(1, Math.floor((width + gap) / (columnWidth + gap)));
        if (newCols !== colCount) setColCount(newCols);
      }
    };
    const observer = new ResizeObserver(updateCols);
    if (containerRef.current) observer.observe(containerRef.current);
    updateCols(); 
    return () => observer.disconnect();
  }, [columnWidth, gap, colCount]);

  // STEP 1: Capture old positions right before rendering new layout
  if (prevItems.current !== items) {
    if (containerRef.current && enableAnimations) {
      const children = Array.from(containerRef.current.querySelectorAll('[data-flip-id]'));
      children.forEach(child => {
        const id = child.getAttribute('data-flip-id');
        prevPositions.current[id] = child.getBoundingClientRect();
      });
    }
    prevItems.current = items;
  }

  // STEP 2: Animate cards to new layout
  useLayoutEffect(() => {
    if (!containerRef.current || !enableAnimations) return;
    
    const children = Array.from(containerRef.current.querySelectorAll('[data-flip-id]'));
    
    children.forEach(child => {
      const id = child.getAttribute('data-flip-id');
      const oldRect = prevPositions.current[id];
      
      if (oldRect) {
        const newRect = child.getBoundingClientRect();
        const deltaX = oldRect.left - newRect.left;
        const deltaY = oldRect.top - newRect.top;

        if (deltaX !== 0 || deltaY !== 0) {
          // Instantly invert to old position
          child.style.transition = 'none';
          child.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
          child.style.zIndex = '100';

          // Play animation to new position
          requestAnimationFrame(() => {
            child.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
            child.style.transform = 'translate(0px, 0px)';
            
            setTimeout(() => {
              child.style.zIndex = '';
              child.style.transition = '';
            }, 400);
          });
        }
      }
    });
    
    prevPositions.current = {};
  }, [items, colCount, enableAnimations]);

  // Distribute items left-to-right securely
  const activeCols = colCount || 1;
  const columns = Array.from({ length: activeCols }, () => []);

  items.forEach((item, index) => {
    columns[index % activeCols].push(item);
  });

  return (
    <div 
      ref={containerRef} 
      style={{ 
        display: 'flex', 
        gap: `${gap}px`, 
        alignItems: 'flex-start', 
        width: '100%', 
        opacity: colCount === 0 ? 0 : 1, 
        transition: 'opacity 0.2s ease-in-out' 
      }}
    >
      {columns.map((col, i) => (
        <div key={`col-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px`, flex: 1, minWidth: 0 }}>
          {col.map((item) => (
            <div key={getItemId(item)} data-flip-id={getItemId(item)}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};