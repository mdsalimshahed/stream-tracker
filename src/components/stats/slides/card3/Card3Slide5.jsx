// src/components/stats/slides/card3/Card3Slide5.jsx
import React, { useEffect, useState, useRef } from 'react';

function checkCollision(r1, r2) {
  // Use a strict padding of 1px to ensure text blocks never overlap but pack tightly
  const pad = 1;
  return !(
    r1.x + r1.w + pad <= r2.x ||
    r1.x >= r2.x + r2.w + pad ||
    r1.y + r1.h + pad <= r2.y ||
    r1.y >= r2.y + r2.h + pad
  );
}

export default function Card3Slide5({ data }) {
  const { tagFrequencies } = data;
  const containerRef = useRef(null);
  const [words, setWords] = useState([]);

  useEffect(() => {
    if (!containerRef.current || !tagFrequencies || tagFrequencies.length === 0) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const cx = width / 2;
    const cy = height / 2;

    const validTags = tagFrequencies.filter(t => t.text && t.text.toLowerCase() !== 'unknown');
    if (validTags.length === 0) return;

    const maxCount = validTags[0].count;
    const minCount = validTags[validTags.length - 1].count;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const placed = [];
    const colors = ['#7c6cfa', '#fa6ca0', '#6cfacc', '#fac86c', '#6cb4fa', '#4ade80', '#c084fc', '#f5a623'];

    validTags.forEach((item, i) => {
      // Very dynamic sizing to ensure tight bounds and variations
      const fontSize = minCount === maxCount ? 40 : 14 + Math.pow((item.count - minCount) / (maxCount - minCount), 0.7) * 70;
      ctx.font = `bold ${fontSize}px sans-serif`;
      const metrics = ctx.measureText(item.text);
      
      // Extremely tight bounding box to remove dead space
      const tw = metrics.width; 
      const th = fontSize * 0.75; 

      // 50% chance for vertical orientation
      const isVertical = Math.random() > 0.5;
      const w = isVertical ? th : tw;
      const h = isVertical ? tw : th;

      let angle = Math.random() * Math.PI * 2; // Start from random angle
      let radius = 0;

      // Small steps for tighter spiral packing
      while (radius < Math.max(width, height)) {
        const x = cx + radius * Math.cos(angle) - w / 2;
        const y = cy + radius * Math.sin(angle) - h / 2;

        const rect = { x, y, w, h };
        
        // Strict bounds checking
        if (x >= 0 && x + w <= width && y >= 0 && y + h <= height) {
          let collision = false;
          for (const p of placed) {
            if (checkCollision(rect, p)) {
              collision = true;
              break;
            }
          }
          if (!collision) {
            const divLeft = x;
            const divTop = y;

            placed.push({
              ...rect,
              text: item.text,
              fontSize,
              isVertical,
              divLeft,
              divTop,
              tw,
              th,
              color: colors[i % colors.length]
            });
            break;
          }
        }

        angle += 0.2;
        radius += 0.5; // Very fine increments clamp them tight
      }
    });

    setWords(placed);
  }, [tagFrequencies]);

  return (
    <div className="absolute inset-0 flex flex-col bg-black/40 outline-none overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full flex-1">
        {words.map((w, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: w.divLeft,
              top: w.divTop,
              width: w.w,
              height: w.h,
              fontSize: w.fontSize,
              color: w.color,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transformOrigin: 'center center',
              whiteSpace: 'nowrap',
              lineHeight: 0.75,
              textShadow: '0px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ transform: w.isVertical ? 'rotate(-90deg)' : 'none' }}>
              {w.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}