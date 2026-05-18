// src/hooks/useSearch.js
import { useState } from 'react';

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    
    const rawgApiKey = localStorage.getItem('rawgApiKey');
    
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

      // STEP 2: Fetch Steam Details & RAWG High-Res Backgrounds
      if (usedSteam && steamItems.length > 0) {
        const appIds = steamItems.map(i => i.id).join(',');
        
        try {
          const detailRes = await fetch(`/steam-api/api/appdetails?appids=${appIds}&l=english`);
          let detailData = null;

          const contentType = detailRes.headers.get("content-type");
          if (detailRes.ok && contentType && contentType.includes("application/json")) {
              detailData = await detailRes.json();
          }

          const detailedSteamItems = await Promise.all(steamItems.map(async item => {
            const d = detailData?.[item.id]?.data;
            let cover_image = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`;
            
            // Fetch from RAWG to get the high-res background image
            if (rawgApiKey) {
              try {
                const cleanName = item.name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
                const rawgRes = await fetch(`https://api.rawg.io/api/games?key=${rawgApiKey}&search=${encodeURIComponent(cleanName)}&page_size=1`);
                const rawgData = await rawgRes.json();
                if (rawgData.results && rawgData.results.length > 0 && rawgData.results[0].background_image) {
                    cover_image = rawgData.results[0].background_image;
                }
              } catch(e) {}
            }

            return { 
              id: item.id.toString(), 
              name: item.name, 
              cover_image, 
              developers: d?.developers ? d.developers.map(dev => ({ name: dev })) : [], 
              released: d?.release_date?.date || '', 
              isRawgOnly: false,
              source: 'STEAM'
            };
          }));

          setSearchResults(detailedSteamItems);
        } catch (err) {
          // Fallback if appdetails fails but we have steamItems
          const fallbackItems = await Promise.all(steamItems.map(async item => {
            let cover_image = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`;
            
            if (rawgApiKey) {
              try {
                const cleanName = item.name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
                const rawgRes = await fetch(`https://api.rawg.io/api/games?key=${rawgApiKey}&search=${encodeURIComponent(cleanName)}&page_size=1`);
                const rawgData = await rawgRes.json();
                if (rawgData.results && rawgData.results.length > 0 && rawgData.results[0].background_image) {
                    cover_image = rawgData.results[0].background_image;
                }
              } catch(e) {}
            }
            
            return { 
              id: item.id.toString(), 
              name: item.name, 
              cover_image, 
              isRawgOnly: false,
              source: 'STEAM'
            };
          }));
          
          setSearchResults(fallbackItems);
        }
      } else {
        // STEP 3: RAWG Fallback
        if (!rawgApiKey) {
          console.warn("RAWG API Key missing. Skipping RAWG fallback search.");
          setSearchResults([]);
          return;
        }

        const rawgRes = await fetch(`https://api.rawg.io/api/games?key=${rawgApiKey}&search=${encodeURIComponent(searchQuery)}&page_size=8`);
        const rawgData = await rawgRes.json();
        
        if (rawgData.results) {
          const detailed = await Promise.all(
            rawgData.results.map(async (g) => {
              try {
                if (g.developers) return g;
                const dRes = await fetch(`https://api.rawg.io/api/games/${g.id}?key=${rawgApiKey}`);
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