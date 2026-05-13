// src/components/stats/CategoryCard.jsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { generatePlaylist } from './utils';
import { getLowResUrl } from '../../utils/helpers';
import { CrossfadeImage } from '../common/UIComponents';

export const CategoryCard = ({ title, games, cssClass, highResImages }) => {
  const eligible = useMemo(() => games.filter(g => g.latestRunLabel === title), [games, title]);

  const playlistRef = useRef([]);
  const indexRef = useRef(0);
  const [currentData, setCurrentData] = useState({ url: null, gameName: '' });

  useEffect(() => {
    const newPlaylist = generatePlaylist(eligible, null);
    playlistRef.current = newPlaylist;
    indexRef.current = 0;
    setCurrentData(newPlaylist[0] || { url: null, gameName: '' });
  }, [eligible]);

  useEffect(() => {
    const totalValidImages = eligible.reduce((acc, g) => acc + new Set((g.thumbnail_urls || []).filter(Boolean)).size, 0);
    if (totalValidImages < 2) return;

    const initialDelay = Math.random() * 2500;
    const cycleInterval = 3000 + Math.random() * 1500;
    
    let interval;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        let idx = indexRef.current + 1;
        
        if (idx >= playlistRef.current.length) {
          const lastGame = playlistRef.current[playlistRef.current.length - 1]?.gameName;
          playlistRef.current = generatePlaylist(eligible, lastGame);
          idx = 0;
        }
        
        indexRef.current = idx;
        setCurrentData(playlistRef.current[idx]);
      }, cycleInterval);
    }, initialDelay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [eligible]);

  const fallback = 'https://placehold.co/480x270/0d1117/1e2938?text=';
  const currentSrc = currentData.url ? getLowResUrl(currentData.url, highResImages) : fallback;
  const gameName = currentData.gameName || '';

  return (
    <div className={`cat-card ${cssClass} group`}>
      <CrossfadeImage 
        src={currentSrc} 
        className="absolute inset-0 w-full h-full" 
        imgClassName="object-cover" 
        duration={700}
      />
      <div className="cat-overlay" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#e8c87a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none" />
      {gameName && <div className="game-name-overlay">{gameName}</div>}
      <div className="cat-content">
        <div className="cat-count">{eligible.length}</div>
        <div className="cat-name">{title}</div>
      </div>
    </div>
  );
};
