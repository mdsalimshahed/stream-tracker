import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import DataManager from './components/DataManager';
import GameProfileModal from './components/GameProfileModal';
import LivestreamSetupWorkspace from './components/LivestreamSetupWorkspace';
import Notification from './components/ui/Notification';
import { RAWG_API_KEY, DEFAULT_THUMBNAIL_CONFIG } from './utils/constants';

export default function App() {
  const [streamData, setStreamData] = useState(() => { try { const s = localStorage.getItem('streamManagerData'); return s ? JSON.parse(s) : {}; } catch (e) { return {}; } });
  const [thumbnailConfig, setThumbnailConfig] = useState(() => { try { const s = localStorage.getItem('thumbnailConfig'); if (s) { const p = JSON.parse(s); return { ...DEFAULT_THUMBNAIL_CONFIG, ...p, manualColors: { ...DEFAULT_THUMBNAIL_CONFIG.manualColors, ...(p.manualColors || {}) }, colors: { ...DEFAULT_THUMBNAIL_CONFIG.colors, ...(p.colors || {}) } }; } } catch (e) {} return DEFAULT_THUMBNAIL_CONFIG; });
  const [currentView, setCurrentView] = useState(() => { try { const s = localStorage.getItem('streamManagerData'); if (s && Object.keys(JSON.parse(s)).length > 0) return 'dashboard'; } catch(e) {} return 'data'; });
  const [toast, setToast] = useState(null);

  useEffect(() => { localStorage.setItem('streamManagerData', JSON.stringify(streamData)); }, [streamData]);
  useEffect(() => { localStorage.setItem('thumbnailConfig', JSON.stringify(thumbnailConfig)); }, [thumbnailConfig]);

  useEffect(() => {
    const recovery = async () => {
      const dataCopy = JSON.parse(JSON.stringify(streamData));
      let changed = false;
      for (const [id, game] of Object.entries(dataCopy)) {
        if (!game.thumbnail_urls || game.thumbnail_urls.length < 2) {
          try {
            const cleanName = game.game_name.replace(/[:™®©]/g, '').replace(/\s+/g, ' ').trim();
            const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(cleanName)}&page_size=1`);
            const d = await res.json();
            if (d.results && d.results[0]) {
              const sRes = await fetch(`https://api.rawg.io/api/games/${d.results[0].id}/screenshots?key=${RAWG_API_KEY}`);
              const sData = await sRes.json();
              if (sData.results) {
                game.thumbnail_urls = [d.results[0].background_image, ...sData.results.map(x => x.image)].filter(Boolean).slice(0, 15);
                changed = true;
              }
            }
          } catch(e) {}
        }
      }
      if (changed) setStreamData(dataCopy);
    };
    if (Object.keys(streamData).length > 0) recovery();
  }, []);

  const [pId, setPId] = useState(null);
  const [wCf, setWCF] = useState(null);
  const [sQ, setSQ] = useState('');
  const [sR, setSR] = useState([]);
  const [isS, setIsS] = useState(false);

  const hS = async (e) => {
    e.preventDefault(); if (!sQ.trim()) return; setIsS(true);
    try { const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(sQ)}&page_size=10`), d = await res.json(); setSR(d.results || []); } 
    catch (err) {} finally { setIsS(false); }
  };

  const hA = async (g) => {
    const rid = g.id.toString(); if (streamData[rid]) { setPId(rid); setCurrentView('library'); return; }
    const year = g.released ? g.released.substring(0, 4) : new Date().getFullYear().toString();
    setStreamData({ ...streamData, [rid]: { game_name: g.name, release_year: year, thumbnail_urls: g.background_image ? [g.background_image] : [], cycles: { main: { stream_count: 0, timestamps: [] } } } });
    setPId(rid);
  };

  const notify = (msg, type) => setToast({ message: msg, type });

  const deleteGame = (id, name) => { 
    const nd = {...streamData}; delete nd[id]; setStreamData(nd); 
    notify(`Permanently Deleted ${name}`, 'error');
  };
  const deleteCycle = (gid, cyc) => { 
    const nd = JSON.parse(JSON.stringify(streamData)); delete nd[gid].cycles[cyc]; setStreamData(nd); 
    notify(`Wiped Run: ${cyc}`, 'error');
  };
  const deleteTimestamp = (gid, cyc, idx, time) => { 
    const nd = JSON.parse(JSON.stringify(streamData)); nd[gid].cycles[cyc].timestamps.splice(idx, 1); nd[gid].cycles[cyc].stream_count = nd[gid].cycles[cyc].timestamps.length; setStreamData(nd); 
    notify(`Purged Log Entry`, 'error');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden font-arial">
      <style>{`
        * { font-family: Arial, sans-serif !important; font-style: normal !important; text-transform: none !important; }
        body { overflow: hidden !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .uppercase { text-transform: uppercase !important; }
      `}</style>

      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="w-full h-[calc(100vh-80px)] overflow-hidden flex flex-col">
        {currentView === 'data' && <DataManager streamData={streamData} setStreamData={setStreamData} />}
        {currentView === 'dashboard' && <Dashboard streamData={streamData} openGameProfile={setPId} />}
        {currentView === 'library' && <Library streamData={streamData} openGameProfile={setPId} onDeleteGame={deleteGame} />}
        {currentView === 'search' && (
          <div className="max-w-5xl mx-auto mt-12 px-4 animate-in fade-in duration-500 overflow-y-auto h-full pb-32 custom-scrollbar">
             <form onSubmit={hS} className="relative group mb-16">
              <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-all"><Search size={36} /></div>
              <input type="text" className="block w-full pl-24 pr-10 py-10 bg-slate-900 border-2 border-slate-800 text-white focus:outline-none focus:ring-4 focus:ring-blue-600/50 text-3xl font-bold shadow-2xl transition-all placeholder:text-slate-800 tracking-tighter" placeholder="Search RAWG Database..." value={sQ} onChange={(e) => setSQ(e.target.value)} />
              <button type="submit" disabled={isS} className="absolute right-5 top-5 bottom-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded px-16 transition-all text-sm tracking-widest shadow-xl">{isS ? <Loader2 className="animate-spin" /> : 'Search DB'}</button>
            </form>
            <div className="space-y-8 pb-40">
              {sR.map(g => (
                <div key={g.id} className="bg-slate-900 border border-slate-800 p-10 flex flex-col sm:flex-row items-center justify-between hover:border-blue-600 transition-all gap-10 group shadow-2xl">
                  <div className="flex items-center gap-12">
                    <div className="w-40 h-24 bg-slate-950 shadow-inner overflow-hidden ring-1 ring-white/10">
                      <img src={g.background_image} alt="cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-3xl tracking-tighter italic">{g.name}</h3>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.5em] mt-3">{g.released || 'Unreleased'}</p>
                    </div>
                  </div>
                  <button onClick={() => hA(g)} className="bg-slate-800 hover:bg-white text-slate-300 hover:text-black px-16 py-5 rounded font-bold transition-all flex items-center gap-4 text-sm uppercase tracking-[0.4em] shadow-2xl border border-white/5 active:scale-95"><Plus size={24}/> Tracker</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {toast && <Notification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {pId && <GameProfileModal gameId={pId} gameData={streamData[pId]} onClose={() => setPId(null)} onStartWorkspace={(id, c, initial) => { setPId(null); setWCF({ gameId: id, cycleName: c, initialStreamCount: initial }); }} onDeleteCycle={deleteCycle} onDeleteTimestamp={deleteTimestamp} onNotify={notify} />}
      {wCf && <LivestreamSetupWorkspace gameId={wCf.gameId} cycleName={wCf.cycleName} initialStreamCount={wCf.initialStreamCount} streamData={streamData} onBack={() => { setPId(wCf.gameId); setWCF(null); }} onSave={setStreamData} config={thumbnailConfig} setConfig={setThumbnailConfig} onNotify={notify} />}
    </div>
  );
}
