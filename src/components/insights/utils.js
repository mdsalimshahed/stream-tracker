// src/components/insights/utils.js
import { parseCustomTimestamp } from '../../utils/helpers';

export const getAllTimestamps = (streamData) => {
  const result = [];
  Object.entries(streamData).forEach(([gameId, game]) => {
    Object.entries(game.cycles || {}).forEach(([cycleId, cycle]) => {
      (cycle.timestamps || []).forEach((ts, idx) => {
        const date = parseCustomTimestamp(ts);
        result.push({
          gameId, gameName: game.game_name,
          cycleName: cycle.displayName || cycleId,
          cover: game.cover_image || game.thumbnail_urls?.[0],
          ts, idx,
          date,
          duration: ts.duration || 0,
          startTime: ts.startTime || ts.date || 0,
          endTime: ts.endTime || null,
          videoId: ts.videoId || null,
          uptimeSecs: ts.startTime && ts.endTime
            ? Math.floor((ts.endTime - ts.startTime) / 1000) : null,
          deficit: ts.startTime && ts.endTime && ts.duration
            ? Math.floor((ts.endTime - ts.startTime) / 1000) - ts.duration : null,
        });
      });
    });
  });
  return result.filter(t => t.date > new Date(2000, 0, 1));
};

export const getAllGames = (streamData) => {
  return Object.entries(streamData).map(([gameId, game]) => {
    const cycles = game.cycles || {};
    const allTs = [];
    Object.entries(cycles).forEach(([cId, cycle]) => {
      (cycle.timestamps || []).forEach(ts => allTs.push({ ...ts, cycleId: cId, cycleName: cycle.displayName || cId }));
    });
    const totalDuration = allTs.reduce((a, t) => a + (t.duration || 0), 0);
    const totalStreams = Object.values(cycles).reduce((a, c) => a + (c.stream_count || 0), 0);
    const labels = Object.values(cycles).map(c => c.label || 'Ongoing');
    const dominantLabel = labels.includes('Completed') ? 'Completed' : labels.includes('Ongoing') ? 'Ongoing' : 'Abandoned';
    const lastDate = allTs.reduce((latest, t) => {
      const d = parseCustomTimestamp(t);
      return d > latest ? d : latest;
    }, new Date(0));
    return { gameId, gameName: game.game_name, cover: game.cover_image || game.thumbnail_urls?.[0], thumbnails: game.thumbnail_urls || [], totalDuration, totalStreams, label: dominantLabel, lastDate, cycles };
  });
};