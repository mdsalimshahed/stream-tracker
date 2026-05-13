// src/components/insights/utils.js

export const PALETTE = [
  '#7c6cfa', '#fa6ca0', '#6cfacc', '#fac86c', 
  '#6cb4fa', '#4ade80', '#f87171', '#fb923c', 
  '#c084fc', '#fb7185'
];

export const processInsightsData = (streamData) => {
  // 1. RAW DATA (Dynamic conversion)
  const GAMES = Object.entries(streamData).map(([id, game]) => {
    const streams = [];
    Object.values(game.cycles || {}).forEach(cycle => {
      (cycle.timestamps || []).forEach(ts => {
        streams.push({
          date: ts.startTime || ts.date || 0,
          dur: ts.duration || 0
        });
      });
    });

    const genres = game.details?.genres ? game.details.genres.split(',').map(g => g.trim()) : [];
    const statuses = Object.values(game.cycles || {}).map(c => c.label);
    const status = statuses.includes('Completed') ? 'Completed' : statuses.includes('Ongoing') ? 'Ongoing' : 'Abandoned';

    return {
      id,
      name: game.game_name,
      developer: game.details?.developer || 'Unknown',
      publisher: game.details?.publisher || 'Unknown',
      releaseYear: parseInt(game.release_year) || new Date().getFullYear(),
      releaseDateStr: game.details?.releaseDate,
      genres,
      status,
      streams: streams.sort((a, b) => a.date - b.date)
    };
  });

  // 2. COMPUTED STATISTICS
  const totalStreams = GAMES.reduce((s, g) => s + g.streams.length, 0);
  const totalSeconds = GAMES.reduce((s, g) => s + g.streams.reduce((a, ss) => a + ss.dur, 0), 0);
  const totalHours = totalSeconds / 3600;
  const completed = GAMES.filter(g => g.status === 'Completed').length;
  const abandoned = GAMES.filter(g => g.status === 'Abandoned').length;
  const ongoing = GAMES.filter(g => g.status === 'Ongoing').length;
  const avgSession = totalStreams > 0 ? (totalSeconds / totalStreams) / 60 : 0;

  // Per-game stats
  const gameStats = GAMES.map(g => {
    const streamCount = g.streams.length;
    const secs = g.streams.reduce((a, s) => a + s.dur, 0);
    const hours = secs / 3600;
    const avg = streamCount > 0 ? (secs / streamCount) / 60 : 0;
    const dates = g.streams.map(s => s.date).sort((a, b) => a - b);
    return { ...g, streamCount, secs, hours, avg, dates, firstDate: dates[0], lastDate: dates[dates.length - 1] };
  });

  // All streams flat
  const allStreams = GAMES.flatMap(g => g.streams.map(s => ({ ...s, game: g.name, status: g.status }))).sort((a, b) => a.date - b.date);

  // Time Stats
  const longest = allStreams.length ? allStreams.reduce((m, s) => s.dur > m.dur ? s : m, allStreams[0]) : null;
  const validForShort = allStreams.filter(s => s.dur > 60);
  const shortest = validForShort.length ? validForShort.reduce((m, s) => s.dur < m.dur ? s : m, validForShort[0]) : null;

  const gaps = [];
  for (let i = 1; i < allStreams.length; i++) {
    gaps.push((allStreams[i].date - allStreams[i - 1].date) / 86400000);
  }
  const maxGap = gaps.length ? Math.max(...gaps) : 0;

  const dayCount = {};
  allStreams.forEach(s => {
    const d = new Date(s.date).toISOString().split('T')[0];
    dayCount[d] = (dayCount[d] || 0) + 1;
  });
  const maxDayEntry = Object.entries(dayCount).reduce((m, [d, c]) => c > m[1] ? [d, c] : m, ['', 0]);

  const firstStreamDate = allStreams.length ? new Date(allStreams[0].date) : new Date();
  const lastStreamDate = allStreams.length ? new Date(allStreams[allStreams.length - 1].date) : new Date();

  return {
    GAMES, gameStats, allStreams, 
    totalStreams, totalSeconds, totalHours, completed, abandoned, ongoing, avgSession,
    longest, shortest, gaps, maxGap, dayCount, maxDayEntry, firstStreamDate, lastStreamDate
  };
};