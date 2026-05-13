// src/components/insights/UIComponents.jsx
import React from 'react';
import { useInView } from './hooks';
import { getLowResUrl } from '../../utils/helpers';

export const HBar = ({ value, max, color = '#e8c87a', delay = 0, inView }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
      <div style={{
        height: '100%', width: inView ? `${pct}%` : '0%',
        background: color, borderRadius: 3,
        transition: `width 1s cubic-bezier(0.2,0.8,0.2,1) ${delay}s`,
      }} />
    </div>
  );
};

export const SectionHeader = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0ece4', letterSpacing: '0.03em', margin: 0 }}>{title}</h2>
    </div>
    {subtitle && <p style={{ fontSize: 12, color: 'rgba(240,236,228,0.4)', marginTop: 4, marginLeft: 32, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{subtitle}</p>}
  </div>
);

export const HeroCard = ({ cover, label, sublabel, value, unit, accent = '#e8c87a', span = 1 }) => {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      gridColumn: `span ${span}`,
      position: 'relative', overflow: 'hidden', borderRadius: 2,
      border: '1px solid rgba(255,255,255,0.08)',
      minHeight: 160,
      background: cover ? 'transparent' : 'rgba(0,0,0,0.5)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 48px rgba(0,0,0,0.7)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {cover && (
        <>
          <img src={getLowResUrl(cover, false)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.4) 100%)' }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 1, padding: 20, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end' }}>
        <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {inView ? value : '—'}
          {unit && <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,236,228,0.5)', marginLeft: 5 }}>{unit}</span>}
        </div>
        {sublabel && <div style={{ fontSize: 12, color: 'rgba(240,236,228,0.55)', marginTop: 6, lineHeight: 1.4 }}>{sublabel}</div>}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${accent}, transparent)`, opacity: 0.7 }} />
      </div>
    </div>
  );
};

export const FactCard = ({ emoji, label, value, sub, accent = '#e8c87a', cover }) => {
  const [ref, inView] = useInView(0.2);
  return (
    <div ref={ref} style={{
      position: 'relative', overflow: 'hidden', borderRadius: 2,
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(0,0,0,0.45)', padding: 18,
      transition: 'transform 0.3s, border-color 0.3s',
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(12px)',
      transitionProperty: 'opacity, transform',
      transitionDuration: '0.5s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}40`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = ''; }}
    >
      {cover && <img src={getLowResUrl(cover, false)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12 }} />}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 18, marginBottom: 6 }}>{emoji}</div>
        <div style={{ fontSize: 10, color: 'rgba(240,236,228,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: accent, lineHeight: 1.2, marginBottom: 3 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.5)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: '100%', background: accent, opacity: 0.6 }} />
    </div>
  );
};