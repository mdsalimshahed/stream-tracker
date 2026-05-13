// src/utils/helpers.js
export const formatRunName = (str) => {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
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
  const dayStr = `${day}${getOrdinalSuffix(day)}`;
  return `${dayStr} ${month} ${year}, ${strTime}`;
};

export const formatDuration = (totalSeconds) => {
  if (!totalSeconds) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

// STRICT UNIX TO GMT+6 FORMATTER
export const formatYtDate = (isoString) => {
  if (!isoString) return '';

  // 1. Turn the YouTube ISO string strictly into UNIX time (milliseconds)
  const unixTimeMs = new Date(isoString).getTime();
  
  // 2. Convert that UNIX time into GMT+6 by adding exactly 6 hours
  // (6 hours * 60 minutes * 60 seconds * 1000 milliseconds)
  const gmt6OffsetMs = 6 * 60 * 60 * 1000;
  const gmt6Date = new Date(unixTimeMs + gmt6OffsetMs);

  // 3. Extract the exact components using UTC methods so the browser CANNOT interfere
  const day = gmt6Date.getUTCDate();
  const year = gmt6Date.getUTCFullYear();
  
  // Use a strict array for months to guarantee exact English formatting
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = monthNames[gmt6Date.getUTCMonth()];
  
  // Extract and format time
  let hours = gmt6Date.getUTCHours();
  const minutes = gmt6Date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = gmt6Date.getUTCSeconds().toString().padStart(2, '0');
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  
  const strTime = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  const dayStr = `${day}${getOrdinalSuffix(day)}`;
  
  // Return your exact original format
  return `${dayStr} ${month} ${year}, ${strTime}`;
};

export const getTsDateStr = (ts) => {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (ts.publishedAt) return formatYtDate(ts.publishedAt);
  return ts.date || '';
};

export const parseCustomTimestamp = (ts) => {
  if (!ts) return new Date(0);
  if (typeof ts === 'object') {
    if (ts.publishedAt) return new Date(ts.publishedAt);
    ts = ts.date || '';
  }
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
  const dayStr = `${day}${getOrdinalSuffix(day)}`;
  return `${dayStr} ${month} ${year}`;
};

export const getOptimizedImage = (url, width) => {
  if (!url) return url;
  if (url.includes('steamstatic.com') || url.includes('steamcdn')) {
    return url.replace(/\.1920x1080\.jpg/i, '.600x338.jpg');
  }
  if (url.includes('media.rawg.io/media/') && !url.includes('/resize/')) {
    return url.replace('media.rawg.io/media/', `media.rawg.io/media/resize/${width || 420}/-/`);
  }
  return url;
};

export const getLowResUrl = (url, useHighRes = false) => {
  if (!url || useHighRes) return url;
  return getOptimizedImage(url, 420);
};