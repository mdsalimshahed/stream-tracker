import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, Upload, Globe, Plus, Save, Loader2, Trash2 } from 'lucide-react';
import ThumbnailCanvas from './ThumbnailCanvas';
import { isLocalPath, generateStreamTitle, generateTimestamp } from '../utils/helpers';
import { RAWG_API_KEY } from '../utils/constants';
import { RangeControl, ColorOverride } from './common/UIComponents';
import { ConfirmBanner } from './Notification';

export default function LivestreamSetupWorkspace({ 
  gameId, cycleName, streamData, onBack, onSave, config, setConfig, onNotify, systemFonts, selectedStreamNumber = null 
}) {
  const game = streamData[gameId];
  if (!game) return null;

  const cycle = game.cycles?.[cycleName];
  const cycleDisplayName = cycle?.displayName || (cycleName === 'main' ? 'First Playthrough' : cycleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

  const [nC] = useState(() => {
    if (selectedStreamNumber !== null && selectedStreamNumber > 0) return selectedStreamNumber;
    return (cycle?.stream_count || 0) + 1;
  });
  
  const year = game.release_year || new Date().getFullYear();
  const cycleIsMain = cycle?.isMain || false;
  const [title] = useState(generateStreamTitle(game.game_name, year, nC, cycleDisplayName, cycleIsMain));
  const [images, setImages] = useState(() => [...(game.thumbnail_urls || [])]);
  const [selImg, setSelImg] = useState(null);
  const [loadingS, setLoadingS] = useState(false);
  const [cF, setCF] = useState(null);
  const [selEl, setSelEl] = useState('title');
  const [urlInput, setUrlInput] = useState('');
  const [hasCycleChanges, setHasCycleChanges] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const validI = images.filter(img => !isLocalPath(img));
  const workspaceCanvasRef = useRef(null);
  const sessionSaved = useRef(false);

  const saveImagesToStorage = (newImages) => {
    const updatedGame = JSON.parse(JSON.stringify(streamData[gameId]));
    updatedGame.thumbnail_urls = newImages;
    const newStreamData = { ...streamData, [gameId]: updatedGame };
    onSave(newStreamData);
  };

  useEffect(() => {
    if (validI.length === 0) {
      setLoadingS(true);
      fetch(`https://api.rawg.io/api/games/${gameId}/screenshots?key=${RAWG_API_KEY}`)
        .then(r => r.json())
        .then(d => {
          if (d.results) {
            const u = d.results.map(s => s.image);
            const newImages = [...images, ...u];
            setImages(newImages);
            saveImagesToStorage(newImages);
            if (u.length > 0) setSelImg(u[0]);
          }
        })
        .finally(() => setLoadingS(false));
    } else if (!selImg) {
      setSelImg(validI[0]);
    }
  }, [gameId]);

  const handleClose = () => {
    if (hasCycleChanges) {
      const confirmClose = window.confirm("You have unsaved stream session changes. Discard?");
      if (!confirmClose) return;
    }
    onBack(cycleName);
  };

  const handleCopy = (silent = false) => {
    navigator.clipboard.writeText(title);
    if (!silent) onNotify('Title copied!', 'info');
  };

  const handleUp = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1280;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const newImages = [...images, dataUrl];
        setImages(newImages);
        setSelImg(dataUrl);
        saveImagesToStorage(newImages);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    const newImages = [...images, urlInput.trim()];
    setImages(newImages);
    setSelImg(urlInput.trim());
    setUrlInput('');
    saveImagesToStorage(newImages);
  };

  const handleFindOnline = () => {
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(game.game_name)}+wallpaper+4k`, '_blank');
  };

  const handleDeleteImage = (idx, imgUrl) => {
    setConfirmDialog({
      title: 'Delete Image',
      message: `Delete this image from "${game.game_name}" gallery?`,
      onConfirm: () => {
        const newImages = [...images];
        newImages.splice(idx, 1);
        setImages(newImages);
        if (selImg === imgUrl) setSelImg(newImages[0] || null);
        saveImagesToStorage(newImages);
        onNotify('Image deleted', 'info');
        setConfirmDialog(null);
      }
    });
  };

  const handleFontUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const font = new FontFace('UFont', buffer);
      await font.load();
      document.fonts.add(font);
      setCF('UFont');
    } catch (err) {
      alert("Font error");
    }
  };

  const handleSaveSession = () => {
    handleCopy(true);
    const nd = JSON.parse(JSON.stringify(streamData));
    if (!nd[gameId].cycles) nd[gameId].cycles = {};
    if (!nd[gameId].cycles[cycleName]) {
      nd[gameId].cycles[cycleName] = { stream_count: 0, timestamps: [], displayName: cycleDisplayName };
    }

    if (selectedStreamNumber === null && !sessionSaved.current) {
      const ts = generateTimestamp();
      nd[gameId].cycles[cycleName].stream_count = nC;
      nd[gameId].cycles[cycleName].timestamps.push(ts);
      sessionSaved.current = true;
      setHasCycleChanges(false);
      onSave(nd);
      onNotify('Session saved & title copied!', 'success');
    } else {
      onSave(nd);
      onNotify(selectedStreamNumber !== null ? 'Session settings saved' : 'Session saved', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black overflow-hidden">
      <div className="w-full h-full bg-neutral-900 flex flex-col">
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-neutral-900/80 backdrop-blur-sm shrink-0 gap-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition bg-white/5 shrink-0">
              <ChevronLeft size={20} />
            </button>
            <div className="overflow-hidden w-full">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate w-full">{game.game_name}</h2>
              <p className="text-xs text-white/50 truncate w-full">{cycleDisplayName} • Episode #{nC}</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
            <button onClick={handleSaveSession} className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-500 px-4 sm:px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition shadow-lg">
              <Save size={16} /> <span className="hidden sm:inline">Save</span> Session
            </button>
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-lg sm:rounded-full transition bg-white/5 flex items-center justify-center">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Change overflow-hidden to overflow-y-auto so the mobile layout can scroll all the way down! */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          
          {/* Top/Left gallery */}
          <div className="w-full lg:w-1/4 xl:w-1/5 lg:min-w-[220px] lg:max-w-[320px] h-auto border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col bg-neutral-900/50 shrink-0">
            <div className="p-3 lg:p-4 space-y-3 lg:space-y-4 shrink-0">
              <div className="flex gap-2">
                <label className="flex-1 bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center cursor-pointer transition">
                  <Upload size={16} className="mx-auto" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleUp} />
                </label>
                <button onClick={handleFindOnline} className="flex-1 bg-white/5 hover:bg-white/10 rounded-lg p-2 transition">
                  <Globe size={16} className="mx-auto" />
                </button>
              </div>
              <div className="flex gap-2 hidden lg:flex">
                <input type="text" placeholder="Image URL..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm" />
                <button onClick={handleAddUrlImage} className="bg-blue-600 hover:bg-blue-500 px-3 rounded-lg transition"><Plus size={16} /></button>
              </div>
            </div>
            
            {/* The magic fix: overflow-x-auto combined with custom-scrollbar renders a touch/mouse horizontal scroll track */}
            <div className="flex-1 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar px-3 lg:px-4 pb-3 lg:pb-4 flex flex-row lg:flex-col gap-3 lg:space-y-3 min-h-[140px] lg:min-h-0 items-center lg:items-stretch">
              {loadingS ? (
                <div className="flex w-full h-full items-center justify-center py-6"><Loader2 className="animate-spin text-white/40" size={28} /></div>
              ) : (
                images.map((img, idx) => (
                  <div key={idx} className="w-32 lg:w-full shrink-0 relative aspect-video cursor-pointer rounded-lg overflow-hidden border-2 transition-all group/image" style={{ borderColor: selImg === img ? '#3b82f6' : 'transparent' }}>
                    <img src={img} onClick={() => setSelImg(img)} className="w-full h-full object-cover" />
                    <button onClick={() => handleDeleteImage(idx, img)} className="absolute bottom-1 right-1 lg:bottom-2 lg:right-2 p-1.5 bg-black/70 rounded-full opacity-0 group-hover/image:opacity-100 transition hover:bg-red-600"><Trash2 size={12} /></button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="flex-1 flex flex-col bg-black min-h-[300px] shrink-0 lg:min-h-0">
            <div className="mx-4 sm:mx-8 mt-4 p-2 sm:p-3 bg-white/10 rounded-lg text-center cursor-pointer hover:bg-white/20 transition" onClick={() => handleCopy(false)}>
              <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Stream Title (Click to Copy)</p>
              <p className="text-white font-medium text-xs sm:text-sm break-all mt-1">{title}</p>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {selImg ? (
                <ThumbnailCanvas
                  canvasRef={workspaceCanvasRef}
                  bgImageUrl={selImg}
                  gameName={game.game_name}
                  cycleName={cycleDisplayName}
                  streamCount={nC}
                  config={config}
                  customFont={cF}
                />
              ) : (
                <div className="text-white/30 text-center text-sm">Select an image from the gallery</div>
              )}
            </div>
          </div>

          {/* Bottom/Right panel: Controls. Height removed on mobile to let it flow down naturally. */}
          <div className="w-full lg:w-1/4 xl:w-1/4 lg:min-w-[280px] lg:max-w-[400px] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-neutral-900/50 shrink-0 lg:h-full">
            <div className="p-3 lg:p-4 border-b border-white/10 shrink-0">
              <select value={selEl} onChange={(e) => setSelEl(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-blue-500 shadow-inner">
                <option value="title">Game Title</option>
                <option value="stream">Livestream #</option>
                <option value="cycle">Run Label</option>
                <option value="layout">Positioning</option>
                <option value="font">Custom Font</option>
              </select>
            </div>
            <div className="flex-1 overflow-visible lg:overflow-y-auto lg:custom-scrollbar p-4 space-y-6 pb-12 lg:pb-4">
              {selEl === 'title' && (
                <>
                  <div className="flex gap-2">
                    <button onClick={() => setConfig(p => ({...p, splitTitle: !p.splitTitle}))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition shadow ${config.splitTitle ? 'bg-blue-600' : 'bg-white/10'}`}>Split Title</button>
                    <button onClick={() => setConfig(p => ({...p, forceInvertTitle: !p.forceInvertTitle}))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition shadow ${config.forceInvertTitle ? 'bg-amber-600' : 'bg-white/10'}`}>Invert Colors</button>
                  </div>
                  <RangeControl label="Title Size" value={config.titleSize} min={40} max={200} onChange={v => setConfig(p => ({...p, titleSize: v}))} />
                  <RangeControl label="Subtitle Size" value={config.subtitleSize} min={40} max={150} onChange={v => setConfig(p => ({...p, subtitleSize: v}))} />
                  <RangeControl label="Outline Weight" value={config.strokeWidth} min={1} max={30} onChange={v => setConfig(p => ({...p, strokeWidth: v}))} />
                  <ColorOverride title="Manual Colors" element="title" config={config} toggle={() => setConfig(p => ({...p, manualColors: {...p.manualColors, title: !p.manualColors.title}}))} onChange={(el, k, v) => setConfig(p => ({...p, colors: {...p.colors, [`${el}${k}`]: v}}))} />
                </>
              )}
              {selEl === 'stream' && (
                <>
                  <RangeControl label="Scale" value={config.streamCountSize} min={40} max={280} onChange={v => setConfig(p => ({...p, streamCountSize: v}))} />
                  <ColorOverride title="Manual Colors" element="stream" config={config} toggle={() => setConfig(p => ({...p, manualColors: {...p.manualColors, streamCount: !p.manualColors.streamCount}}))} onChange={(el, k, v) => setConfig(p => ({...p, colors: {...p.colors, [`${el}${k}`]: v}}))} />
                </>
              )}
              {selEl === 'cycle' && (
                <>
                  <RangeControl label="Scale" value={config.cycleSize} min={30} max={220} onChange={v => setConfig(p => ({...p, cycleSize: v}))} />
                  <ColorOverride title="Manual Colors" element="cycle" config={config} toggle={() => setConfig(p => ({...p, manualColors: {...p.manualColors, cycle: !p.manualColors.cycle}}))} onChange={(el, k, v) => setConfig(p => ({...p, colors: {...p.colors, [`${el}${k}`]: v}}))} />
                </>
              )}
              {selEl === 'layout' && (
                <>
                  <RangeControl label="Title Y Offset" value={config.titleYOffset} min={10} max={550} onChange={v => setConfig(p => ({...p, titleYOffset: v}))} />
                  <RangeControl label="Title Spacing" value={config.titleSpacing} min={0} max={300} onChange={v => setConfig(p => ({...p, titleSpacing: v}))} />
                  <button onClick={() => setConfig(p => ({...p, showBottomShadow: !p.showBottomShadow}))} className={`w-full py-2 rounded-lg text-xs font-medium transition shadow ${config.showBottomShadow ? 'bg-emerald-600' : 'bg-white/10'}`}>Toggle Shadow</button>
                  <RangeControl label="Left/Right Margin" value={config.bottomPaddingX} min={0} max={900} onChange={v => setConfig(p => ({...p, bottomPaddingX: v}))} />
                  <RangeControl label="Bottom Margin" value={config.bottomPaddingY} min={0} max={600} onChange={v => setConfig(p => ({...p, bottomPaddingY: v}))} />
                  <RangeControl label="Label Gap" value={config.bottomSpacing} min={0} max={300} onChange={v => setConfig(p => ({...p, bottomSpacing: v}))} />
                </>
              )}
              {selEl === 'font' && (
                <label className="block w-full bg-white/5 hover:bg-white/10 rounded-lg p-4 text-center cursor-pointer transition shadow-inner">
                  <Upload size={20} className="mx-auto mb-2 text-white/50" />
                  <span className="text-xs text-white/80">Upload .ttf/.otf</span>
                  <input type="file" accept=".ttf,.otf" className="hidden" onChange={handleFontUpload} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmDialog && (
        <ConfirmBanner
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}