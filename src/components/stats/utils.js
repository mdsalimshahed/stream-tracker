// src/components/stats/utils.js
import { parseCustomTimestamp } from '../../utils/helpers';

export const getLatestRunWithTimestamp = (cycles) => {
  let latestRun = null;
  let latestDate = null;
  let latestCycleId = null;
  Object.entries(cycles).forEach(([cycleId, run]) => {
    const timestamps = run.timestamps || [];
    if (timestamps.length > 0) {
      const lastTimestampStr = timestamps[timestamps.length - 1];
      const date = parseCustomTimestamp(lastTimestampStr);
      if (!latestDate || date > latestDate) {
        latestDate = date;
        latestRun = run;
        latestCycleId = cycleId;
      }
    } else if (!latestDate && run.stream_count > 0) {
      latestRun = run;
      latestCycleId = cycleId;
    }
  });
  return { 
    run: latestRun, 
    timestamp: latestRun?.timestamps?.length ? latestRun.timestamps[latestRun.timestamps.length - 1] : null, 
    date: latestDate, 
    cycleId: latestCycleId 
  };
};

export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const generatePlaylist = (games, lastGameName = null) => {
  const validGames = games.filter(g => g.thumbnail_urls && g.thumbnail_urls.length > 0);
  if (validGames.length === 0) return [];

  let shuffledGames = shuffleArray(validGames);

  if (shuffledGames.length > 1 && lastGameName && shuffledGames[0].game_name === lastGameName) {
    const temp = shuffledGames[0];
    shuffledGames[0] = shuffledGames[1];
    shuffledGames[1] = temp;
  }

  let playlist = [];
  shuffledGames.forEach(game => {
    const uniqueThumbs = [...new Set((game.thumbnail_urls || []).filter(Boolean))];
    const shuffledImages = shuffleArray(uniqueThumbs);
    shuffledImages.forEach(url => {
      playlist.push({ url, gameName: game.game_name });
    });
  });

  return playlist;
};
