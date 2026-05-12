// src/hooks/useSearch.js
import { useState } from 'react';
import { RAWG_API_KEY } from '../utils/constants';

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    
    try {
      let steamItems = [];
      let usedSteam = false;
      
      // STEP 1: Search Steam FIRST via Worker Proxy
      try {
        const res = await fetch(`/steam-api/api/storesearch/?term=${encodeURIComponent(searchQuery)}&l=english&cc=US`);
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
            const data = await res.json();
            if (data?.items && data.items.length > 0) {
                steamItems = data.items.slice(0, 8); 
                usedSteam = true;
            }
        }
      } catch (e) {
        console.warn("Steam search failed, falling back to RAWG.", e);
      }

      // STEP 2: Fetch Steam Details
      if (usedSteam && steamItems.length > 0) {
        const appIds = steamItems.map(i => i.id).join(',');
        
        try {
          const detailRes = await fetch(`/steam-api/api/appdetails?appids=${appIds}&l=english`);
          let detailData = null;

          const contentType = detailRes.headers.get("content-type");
          if (detailRes.ok && contentType && contentType.includes("application/json")) {
              detailData = await detailRes.json();
          }

          setSearchResults(steamItems.map(item => {
            const d = detailData?.[item.id]?.data;
            return { 
              id: item.id.toString(), 
              name: item.name, 
              cover_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`, 
              developers: d?.developers ? d.developers.map(dev => ({ name: dev })) : [], 
              released: d?.release_date?.date || '', 
              isRawgOnly: false,
              source: 'STEAM'
            };
          }));
        } catch (err) {
          setSearchResults(steamItems.map(item => ({ 
              id: item.id.toString(), 
              name: item.name, 
              cover_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`, 
              isRawgOnly: false,
              source: 'STEAM'
          })));
        }
      } else {
        // STEP 3: RAWG Fallback
        const rawgRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchQuery)}&page_size=8`);
        const rawgData = await rawgRes.json();
        
        if (rawgData.results) {
          const detailed = await Promise.all(
            rawgData.results.map(async (g) => {
              try {
                if (g.developers) return g;
                const dRes = await fetch(`https://api.rawg.io/api/games/${g.id}?key=${RAWG_API_KEY}`);
                const dData = await dRes.json();
                return { ...g, developers: dData.developers };
              } catch (e) { return g; }
            })
          );
          
          setSearchResults(detailed.map(item => ({ 
              id: item.id.toString(), 
              name: item.name, 
              cover_image: item.background_image || 'https://placehold.co/600x400/1e293b/475569?text=Cover', 
              developers: item.developers || [], 
              released: item.released || '', 
              isRawgOnly: true,
              source: 'RAWG'
          })));
        } else {
          setSearchResults([]);
        }
      }
    } catch (err) { 
        console.error('Search failed entirely:', err); 
    } finally { 
        setIsSearching(false); 
    }
  };

  return { searchQuery, setSearchQuery, searchResults, isSearching, handleSearch };
}