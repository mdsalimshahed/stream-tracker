// src/hooks/useHover.js
import { useState, useRef, useEffect } from 'react';
import { generateSingleGamePlaylist } from '../utils/dataUtils';

export function useHover({ streamData, isModalOpen, layoutPrefs }) {
  const [hoveredImage, setHoveredImage] = useState({ url: '', gameId: null });
  const [hoverState, setHoverState] = useState({ cardId: null, gameId: null });
  const [mosaicPaused, setMosaicPaused] = useState(false);

  const hoverPlaylistRef = useRef({ gameId: null, list: [], index: -1 });
  const hoverTimeoutRef = useRef(null);
  const clearHoverTimeoutRef = useRef(null);

  // Pause mosaic when modal open or hovering
  useEffect(() => {
    if (isModalOpen) { setMosaicPaused(true); return; }
    setMosaicPaused(!!hoverState.gameId);
  }, [isModalOpen, hoverState.gameId]);

  // Image cycling on hover
  useEffect(() => {
    if (isModalOpen) return;
    const gameId = hoverState.gameId;
    const isHovering = Boolean(gameId && streamData[gameId]);
    let intervalId;
    if (isHovering) {
      if (hoverPlaylistRef.current.gameId !== gameId) {
        hoverPlaylistRef.current = { gameId, list: generateSingleGamePlaylist(streamData[gameId].thumbnail_urls || []), index: -1 };
        setHoveredImage({ url: streamData[gameId].cover_image || hoverPlaylistRef.current.list[0] || '', gameId });
      } else {
        const idx = hoverPlaylistRef.current.index;
        setHoveredImage({ url: (idx >= 0 ? hoverPlaylistRef.current.list[idx] : null) || streamData[gameId].cover_image || '', gameId });
      }
      if (hoverPlaylistRef.current.list.length > 0) {
        intervalId = setInterval(() => {
          let idx = hoverPlaylistRef.current.index + 1;
          if (idx >= hoverPlaylistRef.current.list.length) {
            hoverPlaylistRef.current.list = generateSingleGamePlaylist(streamData[gameId].thumbnail_urls || [], hoverPlaylistRef.current.list[hoverPlaylistRef.current.list.length - 1]);
            idx = 0;
          }
          hoverPlaylistRef.current.index = idx;
          setHoveredImage({ url: hoverPlaylistRef.current.list[idx], gameId });
        }, layoutPrefs.hoverCycleInterval || 1500);
      }
    }
    return () => clearInterval(intervalId);
  }, [hoverState.gameId, streamData, isModalOpen, layoutPrefs.hoverCycleInterval]);

  // Clear hover on global click when hover effects disabled
  useEffect(() => {
    if (layoutPrefs.enableHoverEffects !== false) return;
    const handleGlobalClick = () => { if (hoverState.gameId) setHoverState({ cardId: null, gameId: null }); };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [layoutPrefs.enableHoverEffects, hoverState.gameId]);

  const onHoverGame = (cardId, gameId) => {
    if (layoutPrefs.enableHoverEffects === false) return;
    if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
    if (cardId === null) {
      if (!clearHoverTimeoutRef.current) {
        clearHoverTimeoutRef.current = setTimeout(() => {
          setHoverState({ cardId: null, gameId: null });
          clearHoverTimeoutRef.current = null;
        }, 1500);
      }
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        if (clearHoverTimeoutRef.current) { clearTimeout(clearHoverTimeoutRef.current); clearHoverTimeoutRef.current = null; }
        setHoverState({ cardId, gameId });
      }, 1500);
    }
  };

  const handleCardClick = (e, uniqueCardId, gameId, onOpen, cycleId = null) => {
    e.stopPropagation();
    if (layoutPrefs.enableHoverEffects !== false) {
      setHoverState({ cardId: null, gameId: null });
      onOpen(gameId, cycleId);
    } else {
      if (hoverState.cardId === uniqueCardId) {
        setHoverState({ cardId: null, gameId: null });
        onOpen(gameId, cycleId);
      } else {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        if (clearHoverTimeoutRef.current) clearTimeout(clearHoverTimeoutRef.current);
        setHoverState({ cardId: uniqueCardId, gameId });
      }
    }
  };

  return { hoveredImage, hoverState, mosaicPaused, onHoverGame, handleCardClick };
}