// src/utils/dataUtils.js
import { parseCustomTimestamp, extractPlaylistId } from './helpers';

export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const generateSingleGamePlaylist = (images, lastImageUrl = null) => {
  const uniqueThumbs = [...new Set(images.filter(Boolean))];
  if (uniqueThumbs.length === 0) return [];
  if (uniqueThumbs.length === 1) return uniqueThumbs;
  let shuffled = shuffleArray(uniqueThumbs);
  if (lastImageUrl && shuffled[0] === lastImageUrl) {
    const temp = shuffled[0]; shuffled[0] = shuffled[1]; shuffled[1] = temp;
  }
  return shuffled;
};

export const migrateLabels = (data) => {
  let changed = false;
  const newData = JSON.parse(JSON.stringify(data));
  for (const [gameId, game] of Object.entries(newData)) {
    if (game.label && game.cycles) {
      const firstRunKey = game.cycles['main'] ? 'main' : Object.keys(game.cycles)[0];
      if (firstRunKey && game.cycles[firstRunKey]) {
        game.cycles[firstRunKey].label = game.label;
        changed = true;
      }
      delete game.label;
    }
    
    if (game.cycles) {
      for (const [cycleId, cycle] of Object.entries(game.cycles)) {
        // Strip out playlistData entirely
        if (cycle.playlistData) {
          delete cycle.playlistData;
          changed = true;
        }

        // Convert playlist URL to pure ID
        if (cycle.youtubePlaylist && cycle.youtubePlaylist.includes('http')) {
          const id = extractPlaylistId(cycle.youtubePlaylist);
          if (id && id !== cycle.youtubePlaylist) {
            cycle.youtubePlaylist = id;
            changed = true;
          }
        }

        if (cycle.timestamps && cycle.timestamps.length > 0) {
          cycle.timestamps = cycle.timestamps.map(ts => {
            let newTs = { ...ts };
            
            // Clean up old string format
            if (typeof ts === 'string') {
              changed = true;
              return { date: parseCustomTimestamp(ts).getTime() };
            }
            
            // Convert any ISO string fields to Unix Timestamps
            if (typeof newTs.date === 'string') {
              newTs.date = parseCustomTimestamp(newTs.date).getTime();
              changed = true;
            }
            if (typeof newTs.startTime === 'string') {
              newTs.startTime = new Date(newTs.startTime).getTime();
              changed = true;
            }
            if (typeof newTs.endTime === 'string') {
              newTs.endTime = new Date(newTs.endTime).getTime();
              changed = true;
            }
            
            // Unify publishedAt -> startTime to reduce redundancy
            if (newTs.publishedAt) {
              if (!newTs.startTime) newTs.startTime = typeof newTs.publishedAt === 'string' ? new Date(newTs.publishedAt).getTime() : newTs.publishedAt;
              delete newTs.publishedAt;
              changed = true;
            }

            return newTs;
          });
        }
      }
    }
  }
  return { data: newData, changed };
};