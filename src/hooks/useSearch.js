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
      const res = await fetch(`/steam-api/api/storesearch/?term=${searchQuery}&l=english&cc=US`);
      const data = await res.json();
      if (data.items?.length > 0) {
        const appIds = data.items.map(i => i.id).join(',');
        try {
          const detailRes = await fetch(`/steam-api/api/appdetails?appids=${appIds}&l=english`);
          const detailData = await detailRes.json();
          setSearchResults(data.items.map(item => {
            const d = detailData[item.id]?.data;
            return { id: item.id.toString(), name: item.name, cover_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`, developers: d?.developers ? d.developers.map(dev => ({ name: dev })) : [], released: d?.release_date?.date || '', isRawgOnly: false };
          }));
        } catch (err) {
          setSearchResults(data.items.map(item => ({ id: item.id.toString(), name: item.name, cover_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/header.jpg`, isRawgOnly: false })));
        }
      } else {
        const rawgRes = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchQuery)}&page_size=12`);
        const rawgData = await rawgRes.json();
        setSearchResults(rawgData.results?.map(item => ({ id: item.id.toString(), name: item.name, cover_image: item.background_image, developers: item.developers || [], released: item.released || '', isRawgOnly: true })) || []);
      }
    } catch (err) { console.error('Search failed:', err); }
    finally { setIsSearching(false); }
  };

  return { searchQuery, setSearchQuery, searchResults, isSearching, handleSearch };
}