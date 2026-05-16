// src/components/background/MosaicBackground.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { getLowResUrl } from '../../utils/helpers';

const MosaicBackground = React.memo(({ mosaicImages, isPaused, isSlowMode, shouldFlip, highResImages }) => {  
  // 12x24 grid for smaller tiles 
  const ROWS = 7; 
  const IMGS_PER_ROW = 11; 
  
  const rowRefs = useRef([]);
  const requestRef = useRef(null);
  
  const globalStateRef = useRef({ currentSpeed: isSlowMode ? 0.05 : 2.8 });
  const modeRef = useRef({ isPaused, isSlowMode });

  useEffect(() => { 
    modeRef.current = { isPaused, isSlowMode }; 
  }, [isPaused, isSlowMode]);

  const rowsConfig = useMemo(() => {
    const fallback = { url: 'https://placehold.co/110x110/0d1117/1e2938?text=', gameId: 'fallback' };
    
    // Using standard low-res url generation; object-cover will crop the images to fit grid
    const pool = mosaicImages?.length > 0 
      ? mosaicImages.map(img => ({ ...img, url: getLowResUrl(img.url, false) }))
      : [fallback];
      
    const aspectRatios = ['16/9', '4/3', '1/1'];
    
    return Array.from({ length: ROWS }, (_, i) => {
      let sequence = [];
      let lastGameId = null;
      
      while (sequence.length < IMGS_PER_ROW) {
        let shuffled = [...pool].sort(() => Math.random() - 0.5);
        let batch = [];
        while (shuffled.length > 0) {
          let foundIdx = 0;
          if (lastGameId !== null) {
            while (foundIdx < shuffled.length && shuffled[foundIdx].gameId === lastGameId) foundIdx++;
            if (foundIdx === shuffled.length) foundIdx = 0;
          }
          const selected = shuffled[foundIdx];
          batch.push(selected);
          lastGameId = selected.gameId;
          shuffled.splice(foundIdx, 1);
        }
        sequence.push(...batch);
      }
      
      let base = sequence.slice(0, IMGS_PER_ROW);
      
      if (base.length > 2 && base[base.length - 1].gameId === base[0].gameId) {
        for (let k = base.length - 2; k >= 1; k--) {
          if (base[k].gameId !== base[0].gameId && base[k].gameId !== base[base.length - 2].gameId && base[base.length - 1].gameId !== base[k - 1].gameId && base[base.length - 1].gameId !== base[k + 1].gameId) {
            const temp = base[k]; base[k] = base[base.length - 1]; base[base.length - 1] = temp; break;
          }
        }
      }
      
      const baseWithAspect = base.map(b => ({ url: b.url, aspect: aspectRatios[Math.floor(Math.random() * aspectRatios.length)] }));
      
      const baseSpeed = 0.0004 + Math.random() * 0.0008;
      const direction = i % 2 === 0 ? 'left' : 'right';
      
      return { 
        imgs: [...baseWithAspect, ...baseWithAspect], 
        baseSpeed, 
        direction, 
        state: { targetChaos: 1, currentChaos: 1, timer: 0, lerp: 0.001 } 
      };
    });
  }, [mosaicImages, highResImages]);

  useEffect(() => {
    let lastTime = performance.now();
    let positions = rowsConfig.map(c => c.direction === 'right' ? -50 : 0);
    
    const animateLoop = (time) => {
      const delta = time - lastTime; 
      lastTime = time;
      const safeDelta = Math.min(delta, 50); 
      
      const globalLerpFactor = 1 - Math.exp(-safeDelta * 0.0002);
      
      let targetGlobalSpeed = modeRef.current.isPaused ? 0.0 : (modeRef.current.isSlowMode ? 0.05 : 2.8);
      globalStateRef.current.currentSpeed += (targetGlobalSpeed - globalStateRef.current.currentSpeed) * globalLerpFactor;
      
      if (Math.abs(globalStateRef.current.currentSpeed) < 0.001 && targetGlobalSpeed === 0) {
        globalStateRef.current.currentSpeed = 0;
        if (modeRef.current.isPaused) {
          requestRef.current = requestAnimationFrame(animateLoop);
          return;
        }
      }

      rowsConfig.forEach((config, i) => {
        const state = config.state;
        state.timer -= safeDelta;
        
        if (state.timer <= 0) {
          const rand = Math.random();
          if (rand < 0.15) { 
             state.targetChaos = Math.random() * 0.05; 
             state.timer = 1000 + Math.random() * 3000; 
          }
          else if (rand < 0.40) { 
             state.targetChaos = 0.3 + Math.random() * 0.4; 
             state.timer = 2000 + Math.random() * 3000; 
          }
          else if (rand < 0.65) { 
             state.targetChaos = 1.5 + Math.random() * 2.0; 
             state.timer = 1500 + Math.random() * 2500; 
          }
          else { 
             state.targetChaos = 0.8 + Math.random() * 0.6; 
             state.timer = 2000 + Math.random() * 4000; 
          }
          
          state.lerp = 0.0005 + Math.random() * 0.002;
        }
        
        const chaosLerpFactor = 1 - Math.exp(-safeDelta * state.lerp);
        state.currentChaos += (state.targetChaos - state.currentChaos) * chaosLerpFactor;
        
        const actualSpeed = globalStateRef.current.currentSpeed * state.currentChaos * config.baseSpeed;
        const moveAmount = actualSpeed * safeDelta;
        
        if (config.direction === 'left') { 
          positions[i] -= moveAmount; 
          if (positions[i] <= -50) positions[i] += 50; 
        } else { 
          positions[i] += moveAmount; 
          if (positions[i] >= 0) positions[i] -= 50; 
        }
        
        const el = rowRefs.current[i];
        if (el) el.style.transform = `translate3d(${positions[i]}%, 0, 0)`;
      });
      
      requestRef.current = requestAnimationFrame(animateLoop);
    };
    
    requestRef.current = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [rowsConfig]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="flex flex-col h-[100vh] w-full">
        {rowsConfig.map((row, ri) => (
          <div 
            key={ri} 
            className="flex-none flex flex-row items-stretch will-change-transform" 
            style={{ width: 'max-content', height: `${100 / ROWS}vh` }} 
            ref={el => rowRefs.current[ri] = el}
          >
            {row.imgs.map((item, ii) => (
              <div key={ii} className="shrink-0 h-full perspective-1000" style={{ aspectRatio: item.aspect }}>
                <div 
                  className={`relative w-full h-full transition-transform duration-[1200ms] ${shouldFlip ? 'rotate-y-180' : ''}`} 
                  style={{ 
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.8, 0.25, 1)', 
                    transitionDelay: `${(ri * 40) + ((ii % IMGS_PER_ROW) * 20)}ms`, 
                    transformStyle: 'preserve-3d' 
                  }}
                >
                  <div className="absolute inset-0 bg-transparent" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                    <img src={item.url} alt="" className="w-full h-full object-cover block" />
                  </div>
                  <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'transparent' }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export default MosaicBackground;