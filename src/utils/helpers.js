// Sentence Case (Every Word) formatter
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

export const generateStreamTitle = (gameName, year, count, cycleName) => {
  const isMain = cycleName === "main" || cycleName === "First Playthrough";
  const cyclePart = isMain ? "" : ` — [${cycleName}]`;
  return `${gameName} (${year})${cyclePart} Gameplay Livestream #${count}`;
};

export const isLocalPath = (url) => {
  if (!url) return false;
  return !url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:');
};
