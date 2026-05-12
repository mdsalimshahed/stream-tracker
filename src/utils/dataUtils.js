// src/utils/dataUtils.js

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
  }
  return { data: newData, changed };
};