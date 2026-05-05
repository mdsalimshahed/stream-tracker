import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, Save, Upload, Check, Loader2, Layers, Type, RotateCcw } from 'lucide-react';
import ThumbnailCanvas from './ThumbnailCanvas';
import { RangeControl, ColorOverride } from './ui/Controls';
import { generateTimestamp, generateStreamTitle, isLocalPath } from '../utils/helpers';
import { RAWG_API_KEY } from '../utils/constants';

const LivestreamSetupWorkspace = ({ gameId, cycleName, streamData, onBack, onSave, config, setConfig, onNotify, initialStreamCount }) => {
  const game = streamData[gameId]; 
  if (!game) return null;
  
  const nC = initialStreamCount !== null ? (initialStreamCount + 1) : ((game.cycles?.[cycleName]?.stream_count || 0) + 1);
  const year = game.release_year || new Date().getFullYear();
  const [title] = useState(generateStreamTitle(game.game_name, year, nC, cycleName));
  const [images, setImages] = useState(game.thumbnail_urls || []);
  const [selImg, setSelImg] = useState(null);
  const [loadingS, setLoadingS] = useState(false);
  const [cF, setCF] = useState(null);
  const [selEl, setSelEl] = useState('title');
  const validI = images.filter(img => !isLocalPath(img));
  const workspaceCanvasRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    if (validI.length === 0) {
      setLoadingS(true);
      fetch(`https://api.rawg.io/api/games/${gameId}/screenshots?key=${RAWG_API_KEY}`)
        .then(r => r.json())
        .then(d => { 
          if (d.results) { 
            const u = d.results.map(s => s.image); 
            setImages(p => [...p, ...u]); 
            if (u.length > 0) setSelImg(u[0]); 
          } 
        })
        .finally(() => setLoadingS(false));
    } else {
        setSelImg(validI[0]);
    }

    return () => {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, [gameId, validI.length]); 

  const handleCopy = (silent = false) => {
    navigator.clipboard.writeText(title);
    if (!silent) {
      onNotify('Livestream Title Copied!', 'info');
    }
  };

  const handleUp = (e) => {
    const f_ = e.target.files[0]; if (!f_) return;
    const r_ = new FileReader(); r_.onload = (ev) => {
      const i_ = new Image(); i_.onload = () => {
        const c_ = document.createElement('canvas'); const mW = 1280, s_ = i_.width > mW ? mW / i_.width : 1; c_.width = i_.width * s_; c_.height = i_.height * s_;
        c_.getContext('2d').drawImage(i_, 0, 0, c_.width, c_.height); const b_ = c_.toDataURL('image/jpeg', 0.8); setImages(p => [b_, ...p]); setSelImg(b_);
      }; i_.src = ev.target.result;
    }; r_.readAsDataURL(f_);
  };

  const handleF = async (e) => {
    const f_ = e.target.files[0]; if (!f_) return;
    try { const b_ = await f_.arrayBuffer(), ff = new FontFace('UFont', b_); await ff.load(); document.fonts.add(ff); setCF('UFont'); } catch (err) { alert("Font Error"); }
  };

  const handleSaveAll = () => {
    handleCopy(true);
    const nd = JSON.parse(JSON.stringify(streamData));
    if (!nd[gameId].cycles) nd[gameId].cycles = {}; if (!nd[gameId].cycles[cycleName]) nd[gameId].cycles[cycleName] = { stream_count: 0, timestamps: [] };
    
    if (initialStreamCount === null) {
      const ts = generateTimestamp();
      nd[gameId].cycles[cycleName].stream_count = nC;
      nd[gameId].cycles[cycleName].timestamps.push(ts);
    }
    nd[gameId].thumbnail_urls = images;
    onSave(nd);
    onNotify('Session Recorded & Copied!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden h-screen select-none font-arial">
      <div className="w-full h-full bg-slate-900 flex flex-col relative overflow-hidden">
        
        {/* Workspace Header */}
        <div className="flex items-center justify-between px-10 py-6 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-6 overflow-hidden flex-1">
            <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded transition-all shadow-xl">
              <ChevronLeft size={28} />
            </button>
            <div className="flex flex-col overflow-hidden">
               <span className="text-white font-bold text-3xl tracking-tighter whitespace-nowrap">{game.game_name}</span>
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">{cycleName} • EPISODE #{nC}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
             <button onClick={handleSaveAll} className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-5 text-sm font-bold transition-all shadow-2xl active:scale-95">
               <Save size={20}/> Save & Finalize
             </button>
             <button onClick={onBack} className="p-4 bg-slate-800 hover:bg-red-600 text-white transition-all rounded ml-6 shadow-xl">
               <X size={28} />
             </button>
          </div>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Gallery */}
          <div className="w-80 border-r border-slate-800 flex flex-col overflow-hidden shrink-0 bg-slate-950/20">
            <div className="p-8 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 shrink-0">Gallery</h3>
              <label className="w-full flex items-center justify-center gap-4 border border-blue-500/30 bg-blue-500/5 hover:bg-blue-600 hover:text-white text-blue-400 py-5 cursor-pointer text-sm font-bold mb-6 uppercase shrink-0 transition-all shadow-2xl">
                <Upload size={20}/> Add File
                <input type="file" accept="image/*" className="hidden" onChange={handleUp} />
              </label>
              <div className="grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar pr-3 pb-20 flex-1">
                {loadingS ? <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-slate-700 h-12 w-12"/></div> : images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video shrink-0 shadow-2xl">
                    <img src={img} onClick={() => setSelImg(img)} className={`w-full h-full object-cover cursor-pointer border-2 transition-all ${selImg === img ? 'border-blue-500 opacity-100 scale-95' : 'border-slate-800 opacity-30 hover:opacity-100'}`} alt="bg" />
                    {selImg === img && <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 shadow-lg ring-1 ring-white/50"><Check size={14} strokeWidth={6}/></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Visual Center */}
          <div className="flex-1 bg-black overflow-hidden flex items-center justify-center relative p-16">
             {selImg ? (
                <ThumbnailCanvas canvasRef={workspaceCanvasRef} bgImageUrl={selImg} gameName={game.game_name} cycleName={cycleName} streamCount={nC} config={config} customFont={cF} />
             ) : (
                <div className="text-slate-800 font-bold uppercase text-2xl tracking-[1.5em] opacity-20">No Selection</div>
             )}
          </div>

          {/* Sidebar Typography */}
          <div className="w-96 border-l border-slate-800 h-full flex flex-col overflow-hidden shrink-0 bg-slate-900 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
             <div className="p-8 border-b border-slate-800 shrink-0 bg-slate-900/50">
               <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-5"><Layers size={24} className="text-blue-500" /> Stylesheet</h3>
               <select value={selEl} onChange={(e) => setSelEl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-white p-5 text-xs font-bold outline-none cursor-pointer hover:border-blue-600 transition-colors">
                  <option value="title">Game Title</option>
                  <option value="stream">Livestream #</option>
                  <option value="cycle">Run Label</option>
                  <option value="layout">Positioning</option>
                  <option value="font">Custom FONT</option>
                </select>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
                {selEl === 'title' && (<div className="space-y-10 animate-in fade-in duration-500">
                    <div className="flex gap-4">
                       <button onClick={() => setConfig(p => ({...p, splitTitle: !p.splitTitle}))} className={`flex-1 py-4 border-2 transition-all ${config.splitTitle ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`} title="Toggle Split"><Type size={20} className="mx-auto"/></button>
                       <button onClick={() => setConfig(p => ({...p, forceInvertTitle: !p.forceInvertTitle}))} className={`flex-1 py-4 border-2 transition-all ${config.forceInvertTitle ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`} title="Invert Colors"><RotateCcw size={20} className="mx-auto"/></button>
                    </div>
                    <RangeControl label="Title Size" value={config.titleSize} min={40} max={200} onChange={v => setConfig(p => ({...p, titleSize: v}))} />
                    <RangeControl label="Subtitle Size" value={config.subtitleSize} min={40} max={150} onChange={v => setConfig(p => ({...p, subtitleSize: v}))} />
                    <RangeControl label="Outline Weight" value={config.strokeWidth} min={1} max={30} onChange={v => setConfig(p => ({...p, strokeWidth: v}))} />
                    <ColorOverride title="Color Settings" element="title" config={config} toggle={() => setConfig(p => ({...p, manualColors: {...p.manualColors, title: !p.manualColors.title}}))} onChange={(el, k, v) => setConfig(p => ({...p, colors: {...p.colors, [`${el}${k}`]: v}}))} />
                </div>)}
                {selEl === 'stream' && (<div className="space-y-10 animate-in fade-in duration-500"><RangeControl label="Master Scale" value={config.streamCountSize} min={40} max={280} onChange={v => setConfig(p => ({...p, streamCountSize: v}))} /><ColorOverride title="Color Settings" element="stream" config={config} toggle={() => setConfig(p => ({...p, manualColors: {...p.manualColors, streamCount: !p.manualColors.streamCount}}))} onChange={(el, k, v) => setConfig(p => ({...p, colors: {...p.colors, [`${el}${k}`]: v}}))} /></div>)}
                {selEl === 'cycle' && (<div className="space-y-10 animate-in fade-in duration-500"><RangeControl label="Master Scale" value={config.cycleSize} min={30} max={220} onChange={v => setConfig(p => ({...p, cycleSize: v}))} /><ColorOverride title="Color Settings" element="cycle" config={config} toggle={() => setConfig(p => ({...p, manualColors: {...p.manualColors, cycle: !p.manualColors.cycle}}))} onChange={(el, k, v) => setConfig(p => ({...p, colors: {...p.colors, [`${el}${k}`]: v}}))} /></div>)}
                {selEl === 'layout' && (<div className="space-y-10 animate-in fade-in duration-500">
                    <RangeControl label="Title Vertical" value={config.titleYOffset} min={10} max={550} onChange={v => setConfig(p => ({...p, titleYOffset: v}))} />
                    <RangeControl label="Title Gap" value={config.titleSpacing} min={0} max={300} onChange={v => setConfig(p => ({...p, titleSpacing: v}))} />
                    <hr className="border-slate-800"/>
                    <button onClick={() => setConfig(p => ({...p, showBottomShadow: !p.showBottomShadow}))} className={`w-full py-5 text-xs font-bold border-2 transition-all uppercase tracking-widest ${config.showBottomShadow ? 'bg-emerald-600 border-emerald-400 text-white shadow-2xl' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>{config.showBottomShadow ? 'Shadows Enabled' : 'Shadows Disabled'}</button>
                    <RangeControl label="Offset Left" value={config.bottomPaddingX} min={0} max={900} onChange={v => setConfig(p => ({...p, bottomPaddingX: v}))} />
                    <RangeControl label="Offset Bottom" value={config.bottomPaddingY} min={0} max={600} onChange={v => setConfig(p => ({...p, bottomPaddingY: v}))} />
                    <RangeControl label="Label Gap" value={config.bottomSpacing} min={0} max={300} onChange={v => setConfig(p => ({...p, bottomSpacing: v}))} />
                </div>)}
                {selEl === 'font' && (<div className="bg-slate-950 p-8 border-2 border-slate-800 shadow-inner"><label className="w-full flex items-center justify-center gap-5 bg-slate-800 hover:bg-white hover:text-black py-8 rounded cursor-pointer font-bold text-xs uppercase tracking-widest transition-all shadow-2xl"><Upload size={24}/> Load File<input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleF} /></label></div>)}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LivestreamSetupWorkspace;