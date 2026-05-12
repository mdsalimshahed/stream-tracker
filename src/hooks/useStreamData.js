// src/hooks/useStreamData.js
import { useState, useEffect } from 'react';
import { RAWG_API_KEY } from '../utils/constants';
import { migrateLabels } from '../utils/dataUtils';
import { formatRunName } from '../utils/helpers';

export function useStreamData(notify) {
  const [streamData, setStreamData] = useState(() => {
    try {
      const s = localStorage.getItem('streamManagerData');
      if (s) {
        const parsed = JSON.parse(s);
        const { data, changed } = migrateLabels(parsed);
        if (changed) return data;
        return parsed;
      }
    } catch (e) {}
    return {};
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('streamManagerData', JSON.stringify(streamData));
  }, [streamData]);

  // --- Helpers ---
  const fetchSteamDetails = async (steamId) => {
    try {
      const res = await fetch(`/steam-api/api/appdetails?appids=${steamId}&l=english`);
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        return data[steamId]?.data;
      }
    } catch (err) {
      console.warn("Failed to fetch steam details:", err);
    }
    return null;
  };

  const fetchRawgScreenshots = async (gameName) => {
    const cleanName = gameName.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
    const searchRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(cleanName)}&page_size=1`);
    const searchData = await searchRes.json();
    if (!searchData.results?.[0]) return [];
    const rawgId = searchData.results[0].id;
    const sRes = await fetch(`https://api.rawg.io/api/games/${rawgId}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
    const sData = await sRes.json();
    return sData.results?.map(x => x.image) || [];
  };

  // --- Auto-recovery on mount ---
  useEffect(() => {
    if (Object.keys(streamData).length === 0) return;
    const recovery = async () => {
      const dataCopy = JSON.parse(JSON.stringify(streamData));
      let changed = false;
      for (const [id, game] of Object.entries(dataCopy)) {
        if (!game.details) { game.details = { developer: 'Unknown', publisher: 'Unknown', releaseDate: game.release_year, genres: 'Unknown', tags: 'Unknown' }; }
        if (!game.cover_image) {
          game.cover_image = game.thumbnail_urls?.[0] || 'https://placehold.co/600x400/1e293b/475569?text=Cover';
          changed = true;
        }
        if (!game.details.steamUrl && !game.details.notOnSteam) {
          try {
            let steamId = /^\d+$/.test(id) ? id : null;
            if (!steamId) {
              const cleanName = game.game_name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
              const searchRes = await fetch(`/steam-api/api/storesearch/?term=${encodeURIComponent(cleanName)}&l=english&cc=US`);
              if (searchRes.ok && searchRes.headers.get("content-type")?.includes("application/json")) {
                const searchData = await searchRes.json();
                if (searchData.items?.[0]) steamId = searchData.items[0].id;
              }
            }
            if (steamId) {
              const gameDetails = await fetchSteamDetails(steamId);
              if (gameDetails) {
                game.cover_image = gameDetails.header_image;
                let newUrls = gameDetails.screenshots ? gameDetails.screenshots.map(s => s.path_full) : [];
                newUrls = [...newUrls, ...(game.thumbnail_urls || [])];
                game.thumbnail_urls = [...new Set(newUrls)].filter(Boolean);
                game.details.developer = gameDetails.developers?.join(', ') || game.details.developer;
                game.details.publisher = gameDetails.publishers?.join(', ') || game.details.publisher;
                game.details.releaseDate = gameDetails.release_date?.date || game.details.releaseDate;
                game.details.genres = gameDetails.genres?.map(g => g.description).join(', ') || game.details.genres;
                game.details.steamUrl = `https://store.steampowered.com/app/${steamId}/`;
                changed = true;
              }
            }
            await new Promise(r => setTimeout(r, 400));
          } catch (e) {}
        }
        if (!game.thumbnail_urls || game.thumbnail_urls.length < 2) {
          try {
            const shots = await fetchRawgScreenshots(game.game_name);
            if (shots.length) {
              game.thumbnail_urls = [...new Set([...(game.thumbnail_urls || []), ...shots])];
              changed = true;
            }
          } catch (e) {}
        }
      }
      if (changed) setStreamData(dataCopy);
    };
    recovery();
  }, []);

  // --- Manual Sync ---
  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    notify('Starting manual library sync...', 'info');
    const dataCopy = JSON.parse(JSON.stringify(streamData));
    let changed = false;
    for (const [id, game] of Object.entries(dataCopy)) {
      if (!game.details) game.details = { developer: 'Unknown', publisher: 'Unknown', releaseDate: game.release_year, genres: 'Unknown', tags: 'Unknown' };
      if (!game.details.steamUrl && !game.details.notOnSteam) {
        try {
          let steamId = /^\d+$/.test(id) ? id : null;
          if (!steamId) {
            const cleanName = game.game_name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
            const searchRes = await fetch(`/steam-api/api/storesearch/?term=${encodeURIComponent(cleanName)}&l=english&cc=US`);
            if (searchRes.ok && searchRes.headers.get("content-type")?.includes("application/json")) {
               steamId = (await searchRes.json()).items?.[0]?.id;
            }
          }
          if (steamId) {
            const gameDetails = await fetchSteamDetails(steamId);
            if (gameDetails) {
              game.cover_image = gameDetails.header_image;
              let newUrls = gameDetails.screenshots ? gameDetails.screenshots.map(s => s.path_full) : [];
              newUrls = [...newUrls, ...(game.thumbnail_urls || [])];
              game.thumbnail_urls = [...new Set(newUrls)].filter(Boolean);
              game.details = {
                developer: gameDetails.developers?.join(', ') || game.details.developer,
                publisher: gameDetails.publishers?.join(', ') || game.details.publisher,
                releaseDate: gameDetails.release_date?.date || game.details.releaseDate,
                genres: gameDetails.genres?.map(g => g.description).join(', ') || game.details.genres,
                steamUrl: `https://store.steampowered.com/app/${steamId}/`,
                notOnSteam: false,
              };
              changed = true;
            }
          }
          await new Promise(r => setTimeout(r, 400));
        } catch (e) {}
      }
      if (!game.thumbnail_urls || game.thumbnail_urls.length < 2) {
        try {
          const shots = await fetchRawgScreenshots(game.game_name);
          if (shots.length) { game.thumbnail_urls = [...new Set([...(game.thumbnail_urls || []), ...shots])]; changed = true; }
        } catch (e) {}
      }
    }
    if (changed) { setStreamData(dataCopy); notify('Library sync completed!', 'success'); }
    else notify('Library is already up to date.', 'info');
    setIsSyncing(false);
  };

  // --- Add Game ---
  const handleAddGame = async (g) => {
    const rid = g.id.toString();
    if (streamData[rid]) return rid; // already exists, just open it
    notify(g.isRawgOnly ? 'Fetching data from RAWG...' : 'Fetching Steam metadata & RAWG images...', 'info');
    let details = { developer: g.developers?.map(d => d.name).join(', ') || 'Unknown', publisher: 'Unknown', releaseDate: g.released || new Date().getFullYear().toString(), genres: 'Unknown', tags: 'Unknown', steamUrl: g.isRawgOnly ? '' : `https://store.steampowered.com/app/${rid}/`, notOnSteam: g.isRawgOnly || false };
    let cover_image = g.cover_image, thumbnails = [], finalName = g.name, finalYear = g.released ? new Date(g.released).getFullYear().toString() : new Date().getFullYear().toString();
    try {
      if (g.isRawgOnly) {
        const detailRes = await fetch(`https://api.rawg.io/api/games/${rid}?key=${RAWG_API_KEY}`);
        const detailData = await detailRes.json();
        details.developer = detailData.developers?.map(d => d.name).join(', ') || details.developer;
        details.publisher = detailData.publishers?.map(p => p.name).join(', ') || details.publisher;
        details.releaseDate = detailData.released || details.releaseDate;
        details.genres = detailData.genres?.map(gn => gn.name).join(', ') || details.genres;
        details.tags = detailData.tags?.filter(t => t.language === 'eng').map(t => t.name).join(', ') || details.tags;
        if (detailData.background_image) cover_image = detailData.background_image;
        const sRes = await fetch(`https://api.rawg.io/api/games/${rid}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
        const sData = await sRes.json();
        if (sData.results) thumbnails = sData.results.map(x => x.image).filter(Boolean);
      } else {
        const gameDetails = await fetchSteamDetails(rid);
        if (gameDetails) {
          finalName = gameDetails.name || finalName;
          const rDate = gameDetails.release_date?.date;
          finalYear = rDate ? new Date(rDate).getFullYear().toString() : finalYear;
          details.developer = gameDetails.developers?.join(', ') || details.developer;
          details.publisher = gameDetails.publishers?.join(', ') || 'Unknown';
          details.releaseDate = rDate || finalYear;
          details.genres = gameDetails.genres?.map(gn => gn.description).join(', ') || 'Unknown';
          if (gameDetails.header_image) cover_image = gameDetails.header_image;
          if (gameDetails.screenshots) thumbnails = gameDetails.screenshots.map(s => s.path_full);
        }
        try {
          const rawgScreenshots = await fetchRawgScreenshots(finalName);
          const rawgSearchRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(finalName.replace(/[:™®©]/g, '').trim())}&page_size=1`);
          const rawgSearchData = await rawgSearchRes.json();
          if (rawgSearchData.results?.[0]?.tags) {
            const engTags = rawgSearchData.results[0].tags.filter(t => t.language === 'eng').map(t => t.name);
            if (engTags.length > 0) details.tags = engTags.join(', ');
          }
          thumbnails = [...thumbnails, ...rawgScreenshots].filter(Boolean);
        } catch (err) {}
      }
      notify(`Successfully added ${finalName}!`, 'success');
    } catch (e) { notify(`Added ${finalName}, but some data failed to load`, 'error'); }
    setStreamData(prev => ({
      ...prev,
      [rid]: { game_name: finalName, release_year: finalYear, cover_image, thumbnail_urls: [...new Set(thumbnails)], cycles: { main: { stream_count: 0, timestamps: [], isMain: true, youtubePlaylist: '', displayName: 'First Playthrough', label: 'Ongoing' } }, details }
    }));
    return rid;
  };

  // --- Update Game Link ---
  const updateGameLink = async (gameId, steamLink) => {
    let steamId = steamLink.includes('steampowered.com/app/') ? steamLink.split('steampowered.com/app/')[1].split('/')[0].split('?')[0] : steamLink;
    notify('Syncing with Steam & RAWG...', 'info');
    try {
      const gameDetails = await fetchSteamDetails(steamId);
      if (!gameDetails) return notify('Invalid Steam link or ID', 'error');
      let thumbnails = gameDetails.screenshots ? gameDetails.screenshots.map(s => s.path_full) : [];
      let tagsString = 'Unknown';
      try {
        const rawgSearchRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(gameDetails.name)}&page_size=1`);
        const rawgSearchData = await rawgSearchRes.json();
        if (rawgSearchData.results?.[0]) {
          const rawgGame = rawgSearchData.results[0];
          if (rawgGame.tags) { const engTags = rawgGame.tags.filter(t => t.language === 'eng').map(t => t.name); if (engTags.length > 0) tagsString = engTags.join(', '); }
          const sRes = await fetch(`https://api.rawg.io/api/games/${rawgGame.id}/screenshots?key=${RAWG_API_KEY}&page_size=100`);
          const sData = await sRes.json();
          if (sData.results) thumbnails = [...thumbnails, ...sData.results.map(x => x.image)].filter(Boolean);
        }
      } catch (e) {}
      const nd = JSON.parse(JSON.stringify(streamData));
      nd[gameId].game_name = gameDetails.name;
      nd[gameId].release_year = gameDetails.release_date?.date ? new Date(gameDetails.release_date.date).getFullYear().toString() : nd[gameId].release_year;
      nd[gameId].cover_image = gameDetails.header_image;
      nd[gameId].thumbnail_urls = [...new Set(thumbnails)];
      nd[gameId].details = { developer: gameDetails.developers?.join(', ') || 'Unknown', publisher: gameDetails.publishers?.join(', ') || 'Unknown', releaseDate: gameDetails.release_date?.date || nd[gameId].release_year, genres: gameDetails.genres?.map(g => g.description).join(', ') || 'Unknown', tags: tagsString, steamUrl: `https://store.steampowered.com/app/${steamId}/`, notOnSteam: false };
      setStreamData(nd);
      notify('Game updated with Steam & RAWG data!', 'success');
    } catch (e) { notify('Update failed', 'error'); }
  };

  // --- Edit Game Details ---
  const editGameDetails = (gameId, newName, newYear, developer, publisher, genres, tags, steamIdToSync, steamUrl, notOnSteam) => {
    const nd = JSON.parse(JSON.stringify(streamData));
    if (!nd[gameId]) return;
    nd[gameId].game_name = newName;
    if (newYear) nd[gameId].release_year = newYear;
    if (!nd[gameId].details) nd[gameId].details = {};
    if (developer !== undefined) nd[gameId].details.developer = developer;
    if (publisher !== undefined) nd[gameId].details.publisher = publisher;
    if (genres !== undefined) nd[gameId].details.genres = genres;
    if (tags !== undefined) nd[gameId].details.tags = tags;
    if (steamUrl !== undefined) nd[gameId].details.steamUrl = steamUrl;
    if (notOnSteam !== undefined) nd[gameId].details.notOnSteam = notOnSteam;
    setStreamData(nd);
    notify('Game details updated!', 'success');
    if (steamIdToSync) updateGameLink(gameId, steamIdToSync);
  };

  // --- Delete ---
  const deleteGame = (id, name) => { const nd = { ...streamData }; delete nd[id]; setStreamData(nd); notify(`Deleted ${name}`, 'error'); };
  const deleteCycle = (gid, cycId) => { const nd = JSON.parse(JSON.stringify(streamData)); delete nd[gid].cycles[cycId]; setStreamData(nd); notify('Removed run', 'error'); };
  const deleteTimestamp = (gid, cycId, idx) => { const nd = JSON.parse(JSON.stringify(streamData)); nd[gid].cycles[cycId].timestamps.splice(idx, 1); nd[gid].cycles[cycId].stream_count = nd[gid].cycles[cycId].timestamps.length; setStreamData(nd); notify('Deleted log entry', 'error'); };

  // --- Cycle Management ---
  const updateCycle = (gameId, oldCycleId, newDisplayName, isMain, youtubePlaylist, newLabel) => {
    const nd = JSON.parse(JSON.stringify(streamData));
    const cycles = nd[gameId].cycles;
    if (!cycles[oldCycleId]) return;
    const cycleData = cycles[oldCycleId];
    const newId = newDisplayName === 'First Playthrough' ? 'main' : newDisplayName.toLowerCase().replace(/\s+/g, '_');
    if (oldCycleId !== newId) { delete cycles[oldCycleId]; cycles[newId] = cycleData; }
    cycles[newId].displayName = newDisplayName;
    cycles[newId].isMain = isMain;
    cycles[newId].youtubePlaylist = youtubePlaylist || '';
    if (newLabel) cycles[newId].label = newLabel;
    setStreamData(nd);
    notify(`Run updated to "${newDisplayName}"`, 'success');
  };

  const addCycle = (gameId, displayName) => {
    const formattedName = formatRunName(displayName);
    const newId = formattedName === 'First Playthrough' ? 'main' : formattedName.toLowerCase().replace(/\s+/g, '_');
    const nd = JSON.parse(JSON.stringify(streamData));
    if (nd[gameId].cycles[newId]) { notify('A run with that name already exists', 'error'); return false; }
    nd[gameId].cycles[newId] = { stream_count: 0, timestamps: [], isMain: false, youtubePlaylist: '', displayName: formattedName, label: 'Ongoing' };
    setStreamData(nd);
    notify(`Run "${formattedName}" created`, 'success');
    return true;
  };

  return {
    streamData, setStreamData,
    isSyncing,
    handleManualSync,
    handleAddGame,
    updateGameLink,
    editGameDetails,
    deleteGame,
    deleteCycle,
    deleteTimestamp,
    updateCycle,
    addCycle,
  };
}