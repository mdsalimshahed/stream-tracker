import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, Upload, Globe, Plus, Save, Loader2, Trash2 } from 'lucide-react';
import ThumbnailCanvas from './ThumbnailCanvas';
import { isLocalPath, generateStreamTitle, generateTimestamp } from '../utils/helpers';
import { RAWG_API_KEY, DEFAULT_THUMBNAIL_CONFIG } from '../utils/constants';
import { RangeControl, ColorOverride } from './common/UIComponents';
import { ConfirmBanner } from './Notification';

export default function LivestreamSetupWorkspace({ 
  gameId, cycleName, streamData, onBack, onSave, config, setConfig, onNotify, initialStreamCount, systemFonts, streamNumber = null 
}) {
  const game = streamData[gameId];
  if (!game) return null;

  const cycle = game.cycles?.[cycleName];
  const cycleDisplayName = cycle?.displayName || (cycleName === 'main' ? 'First Playthrough' : cycleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

  // Use provided streamNumber (if editing an existing log) else auto-increment
  const [nC] = useState(() => {
    if (streamNumber !== null) return streamNumber;
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
    onNotify('Image added successfully', 'success');
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

    // If we are editing an existing log (streamNumber provided), do NOT add a new timestamp
    if (streamNumber === null && !sessionSaved.current) {
      const ts = generateTimestamp();
      nd[gameId].cycles[cycleName].stream_count = nC;
      nd[gameId].cycles[cycleName].timestamps.push(ts);
      sessionSaved.current = true;
      setHasCycleChanges(false);
      onSave(nd);
      onNotify('New session saved & title copied!', 'success');
    } else if (streamNumber !== null) {
      // Existing log – only save image gallery changes, no new timestamp
      onSave(nd);
      onNotify('Session settings saved (no new log added).', 'info');
    } else {
      onSave(nd);
      onNotify('Session settings saved', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black overflow-hidden">
      <div className="w-full h-full bg-neutral-900 flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-neutral-900/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{game.game_name}</h2>
              <p className="text-xs text-white/40">{cycleDisplayName} • Episode #{nC}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSaveSession} className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition">
              <Save size={16} /> Save Session
            </button>
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left gallery */}
          <div className="w-72 border-r border-white/10 flex flex-col overflow-hidden bg-neutral-900/50">
            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <label className="flex-1 bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center cursor-pointer transition">
                  <Upload size={16} className="mx-auto" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleUp} />
                </label>
                <button onClick={handleFindOnline} className="flex-1 bg-white/5 hover:bg-white/10 rounded-lg p-2 transition">
                  <Globe size={16} className="mx-auto" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Image URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
                />
                <button onClick={handleAddUrlImage} className="bg-blue-600 hover:bg-blue-500 px-3 rounded-lg transition">
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-3">
              {loadingS ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-white/40" size={28} /></div>
              ) : (
                images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video cursor-pointer rounded-lg overflow-hidden border-2 transition-all group/image" style={{ borderColor: selImg === img ? '#3b82f6' : 'transparent' }}>
                    <img src={img} onClick={() => setSelImg(img)} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteImage(idx, img)}
                      className="absolute bottom-2 right-2 p-1.5 bg-black/70 rounded-full opacity-0 group-hover/image:opacity-100 transition hover:bg-red-600"
                      title="Delete image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center: canvas */}
          <div className="flex-1 flex flex-col bg-black">
            <div className="mx-8 mt-4 p-3 bg-white/10 rounded-lg text-center">
              <p className="text-xs text-white/50 uppercase tracking-wider">Stream Title</p>
              <p className="text-white font-medium text-sm break-all mt-1">{title}</p>
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
                <div className="text-white/30 text-center">Select an image from the gallery</div>
              )}
            </div>
          </div>

          {/* Right panel (dropdown selector) */}
          <div className="w-80 border-l border-white/10 flex flex-col overflow-hidden bg-neutral-900/50">
            <div className="p-4 border-b border-white/10">
              <select value={selEl} onChange={(e) => setSelEl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-blue-500">
                <option value="title">Game Title</option>
                <option value="stream">Livestream #</option>
                <option value="cycle">Run Label</option>
                <option value="layout">Positioning</option>
                <option value="font">Custom Font</option>
              </select>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              {selEl === 'title' && (
                <>
                  <div className="flex gap-2">
                    <button onClick={() => setConfig(p => ({...p, splitTitle: !p.splitTitle}))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${config.splitTitle ? 'bg-blue-600' : 'bg-white/10'}`}>Split Title</button>
                    <button onClick={() => setConfig(p => ({...p, forceInvertTitle: !p.forceInvertTitle}))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${config.forceInvertTitle ? 'bg-amber-600' : 'bg-white/10'}`}>Invert Colors</button>
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
                  <button onClick={() => setConfig(p => ({...p, showBottomShadow: !p.showBottomShadow}))} className={`w-full py-2 rounded-lg text-xs font-medium transition ${config.showBottomShadow ? 'bg-emerald-600' : 'bg-white/10'}`}>Toggle Shadow</button>
                  <RangeControl label="Left/Right Margin" value={config.bottomPaddingX} min={0} max={900} onChange={v => setConfig(p => ({...p, bottomPaddingX: v}))} />
                  <RangeControl label="Bottom Margin" value={config.bottomPaddingY} min={0} max={600} onChange={v => setConfig(p => ({...p, bottomPaddingY: v}))} />
                  <RangeControl label="Label Gap" value={config.bottomSpacing} min={0} max={300} onChange={v => setConfig(p => ({...p, bottomSpacing: v}))} />
                </>
              )}
              {selEl === 'font' && (
                <label className="block w-full bg-white/5 hover:bg-white/10 rounded-lg p-4 text-center cursor-pointer transition">
                  <Upload size={20} className="mx-auto mb-2" />
                  <span className="text-xs">Upload .ttf/.otf</span>
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