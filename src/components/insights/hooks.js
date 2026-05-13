// src/components/insights/hooks.js
import { useState, useRef, useEffect } from 'react';

export const useCountUp = (target, duration = 1400, format = (v) => Math.round(v).toLocaleString()) => {
  const [display, setDisplay] = useState('0');
  const raf = useRef(null);
  useEffect(() => {
    if (!target && target !== 0) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(format(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return display;
};

export const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { 
      if (e.isIntersecting) { setInView(true); obs.disconnect(); } 
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};