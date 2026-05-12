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
      
      // STEP 1: Search Steam
      try {
        const res = await fetch(`/steam-api/api/storesearch/?term=${searchQuery}&l=english&cc=US`);
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
            const data = await res.json();
            if (data?.items?.length > 0) {
                steamItems = data.items;
            }
        }
      } catch (e) {
        console.warn("Steam search failed, will fallback to RAWG.", e);
      }

      // STEP 2: Fetch Steam Details
      if (steamItems.length > 0) {
        // SPEED OPTIMIZATION & 400 ERROR FIX: Limit to 5 items
        const topItems = steamItems.slice(0, 5);
        const appIds = topItems.map(i => i.id).join(',');
        
        try {
          const detailRes = await fetch(`/steam-api/api/appdetails?appids=${appIds}&l=english`);
          let detailData = null;

          if (detailRes.ok && detailRes.headers.get("content-type")?.includes("application/json")) {
              detailData = await detailRes.json();
          }

          setSearchResults(topItems.map(item => {
            const d = detailData?.[item.id]?.data;
            return { 
              id: item.id.toString(), 
              name: item.name, 
              cover_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`, 
              developers: d?.developers ? d.developers.map(dev => ({ name: dev })) : [], 
              released: d?.release_date?.date || '', 
              isRawgOnly: false 
            };
          }));
        } catch (err) {
          // Fast fallback if details fail
          setSearchResults(topItems.map(item => ({ 
              id: item.id.toString(), 
              name: item.name, 
              cover_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`, 
              isRawgOnly: false 
          })));
        }
      } else {
        // STEP 3: RAWG Fallback (SPEED OPTIMIZATION: page_size limited to 5)
        const rawgRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchQuery)}&page_size=5`);
        const rawgData = await rawgRes.json();
        setSearchResults(rawgData.results?.map(item => ({ 
            id: item.id.toString(), 
            name: item.name, 
            cover_image: item.background_image, 
            developers: item.developers || [], 
            released: item.released || '', 
            isRawgOnly: true 
        })) || []);
      }
    } catch (err) { 
        console.error('Search failed entirely:', err); 
    } finally { 
        setIsSearching(false); 
    }
  };

  return { searchQuery, setSearchQuery, searchResults, isSearching, handleSearch };
}