// src/components/stats/CategoryCard.jsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { generatePlaylist } from './utils';
import { getLowResUrl } from '../../utils/helpers';
import { CrossfadeImage } from '../common/UIComponents';

export const CategoryCard = ({ title, games, cssClass, highResImages }) => {
  const eligible = useMemo(() => games.filter(g => g.latestRunLabel === title), [games, title]);

  const playlistRef = useRef([]);
  const indexRef = useRef(0);
  const imageTrackerRef = useRef({}); 
  
  const [currentData, setCurrentData] = useState({ url: null, gameName: '' });
  
  // State and Ref for the typewriter effect
  const [displayedName, setDisplayedName] = useState('');
  const displayedNameRef = useRef('');

  useEffect(() => {
    imageTrackerRef.current = {}; 
    const newPlaylist = generatePlaylist(eligible, null, imageTrackerRef.current);
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
          playlistRef.current = generatePlaylist(eligible, lastGame, imageTrackerRef.current);
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

  // Typewriter Effect
  useEffect(() => {
    let isCancelled = false;
    const target = currentData.gameName || '';

    const animateText = async () => {
      // 1. Rapidly erase the old text character by character
      let currentLen = displayedNameRef.current.length;
      for (let i = 0; i < currentLen; i++) {
        if (isCancelled) return;
        displayedNameRef.current = displayedNameRef.current.slice(0, -1);
        setDisplayedName(displayedNameRef.current);
        await new Promise(r => setTimeout(r, 15)); // erase speed
      }

      if (isCancelled) return;
      
      // 2. Wait for the new image to crossfade in (~700ms total, so ~500ms delay here syncs perfectly)
      await new Promise(r => setTimeout(r, 500));

      if (isCancelled) return;
      
      // 3. Type the new text character by character
      for (let i = 0; i <= target.length; i++) {
        if (isCancelled) return;
        displayedNameRef.current = target.slice(0, i);
        setDisplayedName(displayedNameRef.current);
        await new Promise(r => setTimeout(r, 35)); // type speed
      }
    };

    if (target) {
      animateText();
    } else {
      // Just erase if there's no target game
      const eraseOnly = async () => {
        let currentLen = displayedNameRef.current.length;
        for (let i = 0; i < currentLen; i++) {
          if (isCancelled) return;
          displayedNameRef.current = displayedNameRef.current.slice(0, -1);
          setDisplayedName(displayedNameRef.current);
          await new Promise(r => setTimeout(r, 15));
        }
      };
      eraseOnly();
    }

    return () => {
      isCancelled = true;
    };
  }, [currentData.gameName]); // Trigger ONLY when the game name actually changes

  const fallback = 'https://placehold.co/480x270/0d1117/1e2938?text=';
  const currentSrc = currentData.url ? getLowResUrl(currentData.url, highResImages) : fallback;

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
      
      {/* Game Name Overlay with Typewriter Text and Blinking Underscore Cursor */}
      {(displayedName || currentData.gameName) && (
        <div className="game-name-overlay">
          {displayedName}
          <span className="inline-block ml-[2px] animate-pulse font-bold text-white/90 translate-y-[-1px]">_</span>
        </div>
      )}
      
      <div className="cat-content">
        <div className="cat-count">{eligible.length}</div>
        <div className="cat-name">{title}</div>
      </div>
    </div>
  );
};