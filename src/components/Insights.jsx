// src/components/Insights.jsx
import React, { useMemo } from 'react';
import { formatDuration, getLowResUrl } from '../utils/helpers';
import { getAllTimestamps, getAllGames } from './insights/utils';
import { SectionHeader, HeroCard, FactCard } from './insights/UIComponents';
import { HourPolarChart, MonthlyChart, DayHeatmap, DeficitChart, TopGamesList, DonutChart, StreakCalendar, SessionScatter } from './insights/Charts';

export default function Insights({ streamData, systemFonts, layoutPrefs }) {
  // ── Process all data ──────────────────────────────────────────────────────

  const allTs = useMemo(() => getAllTimestamps(streamData), [streamData]);
  const allGames = useMemo(() => getAllGames(streamData), [streamData]);

  // Summary numbers
  const totalStreams = allTs.length;
  const totalGames = allGames.length;
  const totalSeconds = allTs.reduce((a, t) => a + t.duration, 0);
  const totalHours = totalSeconds / 3600;

  // Longest & shortest streams
  const withDuration = allTs.filter(t => t.duration > 60);
  const longestTs = withDuration.reduce((a, t) => t.duration > (a?.duration || 0) ? t : a, null);
  const shortestTs = withDuration.reduce((a, t) => t.duration < (a?.duration || Infinity) ? t : a, null);
  const avgDuration = withDuration.length ? withDuration.reduce((a, t) => a + t.duration, 0) / withDuration.length : 0;

  // Most active day (by date)
  const dayMap = {};
  allTs.forEach(t => {
    const key = t.date.toDateString();
    if (!dayMap[key]) dayMap[key] = { date: t.date, count: 0, seconds: 0, games: new Set() };
    dayMap[key].count++;
    dayMap[key].seconds += t.duration;
    dayMap[key].games.add(t.gameName);
  });
  const activeDays = Object.values(dayMap).sort((a, b) => b.count - a.count);
  const busiestDay = activeDays[0];
  const marathonDay = Object.values(dayMap).sort((a, b) => b.seconds - a.seconds)[0];

  // Streak calculation
  const streamDays = [...new Set(allTs.map(t => {
    const d = t.date;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }))].sort((a, b) => a - b);

  let maxStreak = 0, curStreak = 0, streakStart = null, bestStreakStart = null;
  for (let i = 0; i < streamDays.length; i++) {
    if (i === 0 || streamDays[i] - streamDays[i - 1] === 86400000) {
      curStreak++;
      if (curStreak === 1) streakStart = new Date(streamDays[i]);
    } else { curStreak = 1; streakStart = new Date(streamDays[i]); }
    if (curStreak > maxStreak) { maxStreak = curStreak; bestStreakStart = streakStart; }
  }

  // Hour distribution
  const hourCounts = Array(24).fill(0);
  allTs.forEach(t => {
    const h = t.date.getHours();
    hourCounts[h]++;
  });

  // Day of week
  const dayCounts = Array(7).fill(0);
  allTs.forEach(t => dayCounts[t.date.getDay()]++);

  // Monthly data
  const monthMap = {};
  allTs.forEach(t => {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) monthMap[key] = { key, hours: 0, count: 0 };
    monthMap[key].hours += t.duration / 3600;
    monthMap[key].count++;
  });
  const monthlyData = Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key)).map(m => ({
    ...m,
    label: m.key.replace(/(\d{4})-(\d{2})/, (_, y, mo) => {
      const mn = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      return `${mn[parseInt(mo) - 1]}'${y.slice(2)}`;
    })
  }));
  const peakMonth = monthlyData.reduce((a, m) => m.hours > (a?.hours || 0) ? m : a, null);

  // Game rankings
  const gamesByHours = [...allGames].sort((a, b) => b.totalDuration - a.totalDuration);
  const gamesByStreams = [...allGames].sort((a, b) => b.totalStreams - a.totalStreams);

  // Most dedicated run (single cycle)
  let mostDedicatedRun = null, mostDedicatedSecs = 0;
  allGames.forEach(g => {
    Object.entries(g.cycles || {}).forEach(([cId, cycle]) => {
      const secs = (cycle.timestamps || []).reduce((a, t) => a + (t.duration || 0), 0);
      if (secs > mostDedicatedSecs) {
        mostDedicatedSecs = secs;
        mostDedicatedRun = { gameName: g.gameName, cycleName: cycle.displayName || cId, secs, cover: g.cover };
      }
    });
  });

  // Completion stats
  const completedGames = allGames.filter(g => g.label === 'Completed');
  const ongoingGames = allGames.filter(g => g.label === 'Ongoing');
  const abandonedGames = allGames.filter(g => g.label === 'Abandoned');
  const fastestCompletion = [...completedGames].sort((a, b) => a.totalDuration - b.totalDuration)[0];

  // Deficit data
  const deficitData = allTs
    .filter(t => t.deficit !== null && t.deficit !== undefined)
    .map(t => ({ gameName: t.gameName, deficit: t.deficit, duration: t.duration }));

  const totalDeficitSecs = deficitData.reduce((a, d) => a + d.deficit, 0);
  const totalLostSecs = deficitData.filter(d => d.deficit > 0).reduce((a, d) => a + d.deficit, 0);
  const totalGainedSecs = deficitData.filter(d => d.deficit < 0).reduce((a, d) => a + Math.abs(d.deficit), 0);

  // Night owl vs early bird
  const nightStreams = allTs.filter(t => { const h = t.date.getHours(); return h >= 22 || h < 6; }).length;
  const dayStreams = allTs.filter(t => { const h = t.date.getHours(); return h >= 6 && h < 18; }).length;
  const eveningStreams = allTs.filter(t => { const h = t.date.getHours(); return h >= 18 && h < 22; }).length;
  const maxTimeSegment = Math.max(nightStreams, dayStreams, eveningStreams);
  const timePersonality = maxTimeSegment === nightStreams ? 'Night Owl 🦉' : maxTimeSegment === eveningStreams ? 'Evening Player 🌆' : 'Day Player ☀️';

  // Games with most sessions per game
  const mostAbandoned = [...abandonedGames].sort((a, b) => b.totalStreams - a.totalStreams)[0];

  // ── Empty state ───────────────────────────────────────────────────────────

  if (!totalStreams) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(240,236,228,0.4)', gap: 12 }}>
        <div style={{ fontSize: 40 }}>📊</div>
        <div style={{ fontSize: 16 }}>No stream data to analyze yet.</div>
      </div>
    );
  }

  // ── Container style ───────────────────────────────────────────────────────

  const containerStyle = {
    paddingLeft: `clamp(16px, ${layoutPrefs?.containerPaddingX || 77}px, 5vw)`,
    paddingRight: `clamp(16px, ${layoutPrefs?.containerPaddingX || 77}px, 5vw)`,
    paddingTop: 32,
    paddingBottom: 60,
    fontFamily: '"Inter", system-ui, sans-serif',
    color: '#f0ece4',
    maxWidth: 1400,
    margin: '0 auto',
  };

  const sectionStyle = {
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 4,
    padding: 24,
    marginBottom: 20,
  };

  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 };

  return (
    <div style={{ height: '100%', overflowY: 'auto' }} className="custom-scrollbar">
      <div style={containerStyle}>

        {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f0ece4', letterSpacing: '-0.02em', margin: 0 }}>
              Stream Insights
            </h1>
            <span style={{ fontSize: 12, color: 'rgba(240,236,228,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {totalStreams} sessions · {totalGames} games
            </span>
          </div>
          <div style={{ height: 2, background: 'linear-gradient(to right, #e8c87a, rgba(232,200,122,0.1), transparent)', marginTop: 12, borderRadius: 2 }} />
        </div>

        {/* ── HERO STATS ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <HeroCard label="Total Streams" value={totalStreams.toLocaleString()} accent="#e8c87a" />
          <HeroCard label="Total Playtime" value={`${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m`} accent="#6eb5ff" cover={gamesByHours[0]?.cover} />
          <HeroCard label="Games Tracked" value={totalGames} accent="#3ddc84" />
          <HeroCard label="Avg. Session" value={formatDuration(Math.round(avgDuration))} accent="#c27aff" />
          <HeroCard label="Days Active" value={streamDays.length.toLocaleString()} accent="#ff8c69" />
          <HeroCard label="Longest Streak" value={`${maxStreak} days`} sub={bestStreakStart ? `from ${bestStreakStart.toLocaleDateString()}` : ''} accent="#e8c87a" />
        </div>

        {/* ── PERSONALITY + COMPLETION ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
          
          <div style={sectionStyle}>
            <SectionHeader icon="🎮" title="Your Playstyle" subtitle="Time & behavioral patterns" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 3, textAlign: 'center', border: '1px solid rgba(232,200,122,0.15)' }}>
                <div style={{ fontSize: 28 }}>{timePersonality.split(' ').slice(-1)[0]}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e8c87a', marginTop: 4 }}>{timePersonality.split(' ').slice(0, -1).join(' ')}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.4)', marginTop: 4 }}>
                  {nightStreams} night · {eveningStreams} evening · {dayStreams} day sessions
                </div>
              </div>
              <div style={grid3}>
                <FactCard emoji="🔥" label="Busiest Day" value={busiestDay?.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })} sub={`${busiestDay?.count} streams`} accent="#ff8c69" />
                <FactCard emoji="⏱️" label="Marathon Day" value={marathonDay ? formatDuration(marathonDay.seconds) : '—'} sub={marathonDay?.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })} accent="#6eb5ff" />
                <FactCard emoji="📅" label="Peak Month" value={peakMonth?.key.replace(/(\d{4})-(\d{2})/, (_, y, m) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return `${months[parseInt(m) - 1]} '${y.slice(2)}`;
                })} sub={`${peakMonth?.count} sessions · ${peakMonth?.hours.toFixed(1)}h`} accent="#e8c87a" />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <SectionHeader icon="🏆" title="Game Completion" subtitle="How your library breaks down" />
            <DonutChart segments={[
              { label: 'Completed', value: completedGames.length, color: '#e8c87a' },
              { label: 'Ongoing', value: ongoingGames.length, color: '#3ddc84' },
              { label: 'Abandoned', value: abandonedGames.length, color: '#ff5c5c' },
            ]} />
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {fastestCompletion && (
                <FactCard emoji="⚡" label="Fastest Clear" value={fastestCompletion.gameName} sub={formatDuration(fastestCompletion.totalDuration)} accent="#e8c87a" cover={fastestCompletion.cover} />
              )}
              {mostAbandoned && (
                <FactCard emoji="💀" label="Most Abandoned" value={mostAbandoned.gameName} sub={`After ${mostAbandoned.totalStreams} streams`} accent="#ff5c5c" cover={mostAbandoned.cover} />
              )}
            </div>
          </div>
        </div>

        {/* ── SESSIONS: LONGEST / SHORTEST / RECORDS ───────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="⏳" title="Session Records" subtitle="Individual stream extremes" />
          <div style={grid3}>
            <FactCard emoji="🥇" label="Longest Stream" value={longestTs ? formatDuration(longestTs.duration) : '—'} sub={longestTs ? longestTs.gameName : ''} accent="#e8c87a" cover={longestTs ? streamData[longestTs.gameId]?.cover_image : null} />
            <FactCard emoji="⚡" label="Shortest Stream" value={shortestTs ? formatDuration(shortestTs.duration) : '—'} sub={shortestTs ? shortestTs.gameName : ''} accent="#6eb5ff" cover={shortestTs ? streamData[shortestTs.gameId]?.cover_image : null} />
            <FactCard emoji="⌚" label="Average Session" value={formatDuration(Math.round(avgDuration))} sub={`across ${withDuration.length} timed sessions`} accent="#3ddc84" />
            <FactCard emoji="🎯" label="Most Dedicated Run" value={mostDedicatedRun?.gameName || '—'} sub={mostDedicatedRun ? `${mostDedicatedRun.cycleName} · ${formatDuration(mostDedicatedSecs)}` : ''} accent="#c27aff" cover={mostDedicatedRun?.cover} />
            <FactCard emoji="🗓️" label="Most Active Day" value={busiestDay ? `${busiestDay.count} streams` : '—'} sub={busiestDay?.date.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })} accent="#ff8c69" />
            <FactCard emoji="🔁" label="Longest Streak" value={`${maxStreak} consecutive days`} sub={bestStreakStart ? `starting ${bestStreakStart.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''} accent="#e8c87a" />
          </div>
        </div>

        {/* ── SESSION LENGTH SCATTER ────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="📈" title="Session Length Over Time" subtitle="Every stream plotted · hover to inspect" />
          <SessionScatter timestamps={allTs} />
        </div>

        {/* ── ACTIVITY CALENDAR ─────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="📆" title="Stream Calendar" subtitle="Last 6 months of activity" />
          <StreakCalendar timestamps={allTs} />
        </div>

        {/* ── HOURLY + WEEKLY ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
          <div style={sectionStyle}>
            <SectionHeader icon="🕐" title="When Do You Play?" subtitle="Streams by hour of day" />
            <HourPolarChart hourCounts={hourCounts} />
          </div>
          <div style={sectionStyle}>
            <SectionHeader icon="📅" title="Day of the Week" subtitle="Which day you stream most" />
            <DayHeatmap dayCounts={dayCounts} />
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, color: 'rgba(240,236,228,0.35)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Breakdown</div>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(240,236,228,0.6)', padding: '3px 0' }}>
                  <span>{day}</span>
                  <span style={{ color: dayCounts[i] === Math.max(...dayCounts) ? '#e8c87a' : 'rgba(240,236,228,0.6)', fontWeight: dayCounts[i] === Math.max(...dayCounts) ? 700 : 400 }}>
                    {dayCounts[i]} streams ({totalStreams > 0 ? Math.round(dayCounts[i] / totalStreams * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MONTHLY ACTIVITY ──────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="📊" title="Monthly Activity" subtitle="Total hours streamed per month · hover bars" />
          <MonthlyChart monthlyData={monthlyData} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginTop: 16 }}>
            <FactCard emoji="📈" label="Most Active Month" value={peakMonth?.key.replace(/(\d{4})-(\d{2})/, (_, y, m) => { const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; return months[parseInt(m) - 1] + ' ' + y; })} sub={`${peakMonth?.hours.toFixed(1)}h · ${peakMonth?.count} streams`} accent="#e8c87a" />
            <FactCard emoji="📉" label="Quietest Month" value={(() => { const quietest = monthlyData.reduce((a, m) => m.hours < (a?.hours ?? Infinity) ? m : a, null); if (!quietest) return '—'; const [y, mo] = quietest.key.split('-'); const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return `${months[parseInt(mo) - 1]} ${y}`; })()} sub={`${monthlyData.reduce((a, m) => m.hours < (a?.hours ?? Infinity) ? m : a, null)?.hours.toFixed(1)}h`} accent="#ff5c5c" />
            <FactCard emoji="📊" label="Monthly Average" value={monthlyData.length ? formatDuration(Math.round((totalSeconds / monthlyData.length))) : '—'} sub={`over ${monthlyData.length} active months`} accent="#6eb5ff" />
          </div>
        </div>

        {/* ── TOP GAMES: HOURS ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
          <div style={sectionStyle}>
            <SectionHeader icon="⏰" title="Most Played by Hours" subtitle="Total VOD duration" />
            <TopGamesList items={gamesByHours} valueKey="totalDuration" formatVal={formatDuration} color="#e8c87a" />
          </div>
          <div style={sectionStyle}>
            <SectionHeader icon="🎮" title="Most Played by Sessions" subtitle="Raw stream count" />
            <TopGamesList items={gamesByStreams} valueKey="totalStreams" formatVal={(v) => `${v} streams`} color="#6eb5ff" />
          </div>
        </div>

        {/* ── VOD DEFICIT ───────────────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="⚖️" title="VOD Time Deficit" subtitle="Difference between stream uptime and YouTube VOD duration · hover to inspect" />
          {deficitData.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
                <FactCard emoji="⏱️" label="Total Sessions Analyzed" value={deficitData.length} sub={`of ${totalStreams} total`} accent="#6eb5ff" />
                <FactCard emoji="📉" label="Total Time Lost" value={formatDuration(totalLostSecs)} sub="VOD shorter than uptime" accent="#ff5c5c" />
                <FactCard emoji="📈" label="Total Time Gained" value={formatDuration(totalGainedSecs)} sub="VOD longer than uptime" accent="#3ddc84" />
                <FactCard emoji="⚖️" label="Net Difference" value={totalDeficitSecs > 0 ? `-${formatDuration(totalDeficitSecs)}` : `+${formatDuration(-totalDeficitSecs)}`} sub={totalDeficitSecs > 0 ? 'Lost overall' : 'Gained overall'} accent={totalDeficitSecs > 0 ? '#ff5c5c' : '#3ddc84'} />
              </div>
              <DeficitChart deficitData={deficitData} />
            </>
          ) : (
            <div style={{ color: 'rgba(240,236,228,0.35)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              No start/end time data available. Sync your playlists to populate this chart.
            </div>
          )}
        </div>

        {/* ── ALL GAMES RANKED TABLE ────────────────────────────────────── */}
        <div style={sectionStyle}>
          <SectionHeader icon="📋" title="Full Game Rankings" subtitle="Every game sorted by total playtime" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['#', 'Game', 'Streams', 'Total Time', 'Avg. Session', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(240,236,228,0.35)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gamesByHours.map((g, i) => {
                  const avgSec = g.totalStreams > 0 ? g.totalDuration / g.totalStreams : 0;
                  const labelColor = g.label === 'Completed' ? '#e8c87a' : g.label === 'Ongoing' ? '#3ddc84' : '#ff5c5c';
                  return (
                    <tr key={g.gameId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '10px 12px', color: i < 3 ? '#e8c87a' : 'rgba(240,236,228,0.3)', fontWeight: i < 3 ? 700 : 400 }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {g.cover && <img src={getLowResUrl(g.cover, false)} alt="" style={{ width: 28, height: 16, objectFit: 'cover', borderRadius: 1, opacity: 0.7, flexShrink: 0 }} />}
                          <span style={{ color: 'rgba(240,236,228,0.85)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{g.gameName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,236,228,0.6)', fontVariantNumeric: 'tabular-nums' }}>{g.totalStreams}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,236,228,0.8)', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatDuration(g.totalDuration) || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(240,236,228,0.5)', fontVariantNumeric: 'tabular-nums' }}>{avgSec > 0 ? formatDuration(Math.round(avgSec)) : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: `${labelColor}18`, color: labelColor, border: `1px solid ${labelColor}35`, borderRadius: 3, padding: '2px 7px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {g.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', color: 'rgba(240,236,228,0.2)', fontSize: 11, marginTop: 16, letterSpacing: '0.06em' }}>
          Analyzed {totalStreams} streams across {totalGames} games · {formatDuration(totalSeconds)} of footage
        </div>

      </div>
    </div>
  );
}