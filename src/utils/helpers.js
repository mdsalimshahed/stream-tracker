// src/utils/helpers.js
export const formatRunName = (str) => {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const generateTimestamp = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const strTime = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  const suffix = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
  const dayStr = `${day}${suffix[day % 10]}`;
  return `${dayStr} ${month} ${year}, ${strTime}`;
};

export const parseCustomTimestamp = (ts) => {
  try {
    const cleanTs = ts.replace(/(st|nd|rd|th)/, '');
    const d = new Date(cleanTs);
    if (!isNaN(d.getTime())) return d;
  } catch (e) { }
  return new Date(0);
};

export const generateStreamTitle = (gameName, year, count, cycleName, isMainCycle = false) => {
  if (isMainCycle || cycleName === "main" || cycleName === "First Playthrough") {
    return `${gameName} (${year}) — Gameplay Livestream #${count}`;
  } else {
    return `${gameName} (${year}) — [${cycleName}] Gameplay Livestream #${count}`;
  }
};

export const isLocalPath = (url) => {
  if (!url) return false;
  return !url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:');
};

export const formatReleaseDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const suffix = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
  const dayStr = `${day}${suffix[day % 10]}`;
  return `${dayStr} ${month} ${year}`;
};

export const getLowResUrl = (url, useHighRes = false) => {
  // If the toggle is ON, immediately return the raw 1080p/4K URL
  if (!url || useHighRes) return url;
  
  // Steam: Convert 1080p screenshots to 600x338 thumbnails
  if (url.includes('steamstatic.com') || url.includes('steamcdn')) {
    return url.replace(/\.1920x1080\.jpg/i, '.600x338.jpg');
  }
  
  // RAWG: Inject resize parameters to compress heavy 4K raw images to 420p
  if (url.includes('media.rawg.io/media/') && !url.includes('/resize/')) {
    return url.replace('media.rawg.io/media/', 'media.rawg.io/media/resize/420/-/');
  }
  
  return url;
};