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

export const extractPlaylistId = (urlOrId) => {
  if (!urlOrId) return '';
  const match = urlOrId.match(/[&?]list=([^&]+)/i);
  return match ? match[1] : urlOrId;
};

export const generateTimestamp = () => {
  return Date.now();
};

export const formatDuration = (totalSeconds) => {
  if (!totalSeconds) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

// FORMATTER (Uses Local Browser Timezone)
export const formatYtDate = (ts) => {
  if (!ts) return '';

  const localDate = new Date(ts);

  const day = localDate.getDate();
  const year = localDate.getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = monthNames[localDate.getMonth()];
  
  let hours = localDate.getHours();
  const minutes = localDate.getMinutes().toString().padStart(2, '0');
  const seconds = localDate.getSeconds().toString().padStart(2, '0');
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  
  const strTime = `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  const dayStr = `${day}${getOrdinalSuffix(day)}`;
  
  return `${dayStr} ${month} ${year}, ${strTime}`;
};

// Only returns the time block (e.g. 06:42:27 PM)
export const formatTimeOnly = (ts) => {
  if (!ts) return '';
  const localDate = new Date(ts);
  let hours = localDate.getHours();
  const minutes = localDate.getMinutes().toString().padStart(2, '0');
  const seconds = localDate.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
};

// Intelligently formats the start to end time, checking if the date crossed over midnight
export const formatStreamTimeRange = (startTs, endTs) => {
  if (!startTs) return '';
  if (!endTs) return formatYtDate(startTs);
  
  const start = new Date(startTs);
  const end = new Date(endTs);
  
  const isSameDay = 
    start.getDate() === end.getDate() && 
    start.getMonth() === end.getMonth() && 
    start.getFullYear() === end.getFullYear();
                    
  if (isSameDay) {
    return `${formatYtDate(startTs)} — ${formatTimeOnly(endTs)}`;
  } else {
    // If the stream crossed midnight into a new day, show the full date for the end time too
    return `${formatYtDate(startTs)} — ${formatYtDate(endTs)}`;
  }
};

// Calculates the deficit between stream uptime and VOD duration
export const calculateDeficit = (startTs, endTs, durationSecs) => {
  if (!startTs || !endTs || durationSecs == null) return '';
  
  const start = new Date(startTs).getTime();
  const end = new Date(endTs).getTime();
  const uptimeSecs = Math.floor((end - start) / 1000);
  
  const diffSecs = uptimeSecs - durationSecs;
  if (diffSecs === 0) return '';
  
  const status = diffSecs > 0 ? 'lost' : 'gained';
  const absDef = Math.abs(diffSecs);
  
  const h = Math.floor(absDef / 3600);
  const m = Math.floor((absDef % 3600) / 60);
  const s = absDef % 60;
  
  let str = '';
  if (h > 0) str += `${h}h `;
  if (m > 0 || h > 0) str += `${m}m `;
  str += `${s}s`;
  
  return ` (${str.trim()} ${status})`;
};

export const getTsDateStr = (ts) => {
  if (!ts) return '';
  if (typeof ts === 'string' || typeof ts === 'number') return formatYtDate(ts);
  
  if (ts.startTime) return formatYtDate(ts.startTime);
  if (ts.publishedAt) return formatYtDate(ts.publishedAt);
  if (ts.date) return formatYtDate(ts.date); 
  
  return '';
};

export const parseCustomTimestamp = (ts) => {
  if (!ts) return new Date(0);
  if (typeof ts === 'object') {
    if (ts.startTime) return new Date(ts.startTime);
    if (ts.publishedAt) return new Date(ts.publishedAt);
    ts = ts.date || '';
  }
  if (typeof ts === 'number') return new Date(ts);
  try {
    const cleanTs = String(ts).replace(/(st|nd|rd|th)/, '');
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
  // Overridden: Just return the exact unmodified original image
  return url;
};

export const getLowResUrl = (url, useHighRes = false) => {
  // Overridden: Bypass the sizing logic entirely 
  return url;
};