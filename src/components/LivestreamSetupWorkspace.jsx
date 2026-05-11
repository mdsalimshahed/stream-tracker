// src/components/LivestreamSetupWorkspace.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ImagePlus, Globe, Plus, Save, Loader2, Trash2, Bold, Italic } from 'lucide-react';
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
  
  // Inject cover_image into the gallery if it exists
  const [images, setImages] = useState(() => {
    const urls = game.thumbnail_urls || [];
    if (game.cover_image && !urls.includes(game.cover_image)) {
      return [game.cover_image, ...urls];
    }
    return [...urls];
  });
  
  const [selImg, setSelImg] = useState(null);
  const [loadingS, setLoadingS] = useState(false);
  const [selEl, setSelEl] = useState('title');
  const [urlInput, setUrlInput] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [hasCycleChanges, setHasCycleChanges] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmFontDialog, setConfirmFontDialog] = useState(null);

  // Directly track the custom font via persistent config instead of local reset-prone state
  const cF = config.customFont || null;
  const setCF = (font) => setConfig(p => ({ ...p, customFont: font }));

  const validI = images.filter(img => !isLocalPath(img));
  const workspaceCanvasRef = useRef(null);
  const sessionSaved = useRef(false);

  // Inject saved Google Fonts into the document head immediately on component mount
  useEffect(() => {
    if (config.savedFonts) {
      config.savedFonts.forEach(font => {
        if (!document.querySelector(`link[href="${font.url}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = font.url;
          document.head.appendChild(link);
        }
      });
    }
  }, [config.savedFonts]);

  const saveImagesToStorage = (newImages) => {
    const updatedGame = JSON.parse(JSON.stringify(streamData[gameId]));
    updatedGame.thumbnail_urls = newImages.filter(img => img !== game.cover_image);
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
    if (imgUrl === game.cover_image) {
      onNotify("Cannot delete the primary cover image", "error");
      return;
    }

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

  const handleAddGoogleFont = async () => {
    if (!embedCode.trim()) return;
    const text = embedCode.trim();
    
    // Support parsing both the full HTML <link> embed block, or a direct URL paste
    const urlMatch = text.match(/(https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s>]+)/);
    const urlString = urlMatch ? urlMatch[1].replace(/&amp;/g, '&') : text.replace(/&amp;/g, '&');
    
    if (!urlString.includes('fonts.googleapis.com/css2')) {
       onNotify('Invalid Google Fonts code or URL', 'error');
       return;
    }
    
    try {
      const parsedUrl = new URL(urlString);
      const families = parsedUrl.searchParams.getAll('family');
      
      if (families.length === 0) {
         onNotify('No font families found in URL', 'error');
         return;
      }

      let addedCount = 0;
      const currentFonts = config.savedFonts || [];
      let newFontsList = [...currentFonts];
      const newFamilies = [];

      families.forEach(famParam => {
        const rawName = famParam.split(':')[0];
        const cleanName = rawName.replace(/\+/g, ' ');

        if (!newFontsList.some(f => f.family === cleanName)) {
          newFontsList.push({ family: cleanName, url: urlString });
          newFamilies.push(cleanName);
          addedCount++;
        }
      });

      if (addedCount > 0) {
         newFontsList.sort((a, b) => a.family.localeCompare(b.family));
         setConfig(p => ({ ...p, savedFonts: newFontsList }));
         
         if (!document.querySelector(`link[href="${urlString}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = urlString;
            link.onload = async () => {
              try {
                await document.fonts.load(`16px "${newFamilies[0]}"`);
              } catch(e) {}
              setCF(newFamilies[0]);
            };
            document.head.appendChild(link);
         } else {
            setCF(newFamilies[0]);
         }
         onNotify(`Added ${addedCount} new font(s)`, 'success');
      } else {
         onNotify('Font(s) already in gallery', 'info');
      }
      setEmbedCode('');
    } catch (e) {
      onNotify('Failed to parse URL', 'error');
    }
  };

  const handleDeleteFont = (family) => {
    setConfirmFontDialog({
      title: 'Delete Font',
      message: `Are you sure you want to remove "${family}" from your gallery?`,
      onConfirm: () => {
        setConfig(p => ({ ...p, savedFonts: (p.savedFonts || []).filter(f => f.family !== family) }));
        if (cF === family) setCF(null);
        onNotify('Font removed', 'info');
        setConfirmFontDialog(null);
      }
    });
  };

  const handleSaveSession = () => {
    handleCopy(true);
    
    // Auto-download the thumbnail
    if (workspaceCanvasRef.current) {
      const dataUrl = workspaceCanvasRef.current.toDataURL('image/jpeg', 0.92);
      const safeName = game.game_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${safeName}_ep${nC}_thumbnail.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

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
      onNotify('Session saved, title copied & thumbnail downloaded!', 'success');
    } else {
      onSave(nd);
      onNotify(selectedStreamNumber !== null ? 'Session settings saved & thumbnail downloaded!' : 'Session saved & thumbnail downloaded!', 'success');
    }
  };

  const sortedFonts = [...(config.savedFonts || [])].sort((a, b) => a.family.localeCompare(b.family));
  // Provide the default local repository font to the top of the array
  const displayFonts = [{ family: 'Book Antiqua', isLocal: true }, ...sortedFonts];

  return (
    <>
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

          <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar">
            
            {/* Top/Left gallery */}
            <div className="w-full lg:w-1/4 xl:w-1/5 lg:min-w-[220px] lg:max-w-[320px] h-auto border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col bg-neutral-900/50 shrink-0">
              <div className="p-3 lg:p-4 space-y-3 lg:space-y-4 shrink-0">
                <div className="flex gap-2">
                  <label className="flex-1 bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center cursor-pointer transition">
                    <ImagePlus size={16} className="mx-auto" />
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
            <div className="flex-none lg:flex-1 flex flex-col bg-black min-h-[300px] shrink-0 lg:min-h-0 overflow-hidden">
              <div className="mx-4 sm:mx-8 mt-4 p-2 sm:p-3 bg-white/10 rounded-lg text-center cursor-pointer hover:bg-white/20 transition" onClick={() => handleCopy(false)}>
                <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Stream Title (Click to Copy)</p>
                <p className="text-white font-medium text-xs sm:text-sm break-all mt-1">{title}</p>
              </div>
              
              <div className="flex-1 relative overflow-hidden">
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
                  <div className="flex w-full h-full items-center justify-center text-white/30 text-sm">Select an image from the gallery</div>
                )}
              </div>
            </div>

            {/* Bottom/Right panel: Controls */}
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
              
              <div className="flex-none lg:flex-1 flex flex-col lg:overflow-hidden min-h-0">
                {selEl === 'title' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-12 lg:pb-4">
                    <div className="flex gap-2">
                      <button onClick={() => setConfig(p => ({...p, titleBold: !p.titleBold}))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition shadow flex items-center justify-center gap-1.5 ${config.titleBold ? 'bg-blue-600' : 'bg-white/10'}`}><Bold size={16} /> Bold</button>
                      <button onClick={() => setConfig(p => ({...p, titleItalic: !p.titleItalic}))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition shadow flex items-center justify-center gap-1.5 ${config.titleItalic ? 'bg-blue-600' : 'bg-white/10'}`}><Italic size={16} /> Italic</button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setConfig(p => ({...p, splitTitle: !p.splitTitle}))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition shadow ${config.splitTitle ? 'bg-blue-600' : 'bg-white/10'}`}>Split Title</button>
                      <button onClick={() => setConfig(p => ({...p, forceInvertTitle: !p.forceInvertTitle}))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition shadow ${config.forceInvertTitle ? 'bg-amber-600' : 'bg-white/10'}`}>Invert Colors</button>
                    </div>
                    <RangeControl label="Title Size" value={config.titleSize} min={40} max={200} onChange={v => setConfig(p => ({...p, titleSize: v}))} />
                    <RangeControl label="Title Letter Spacing" value={config.titleLetterSpacing || 0} min={-10} max={100} onChange={v => setConfig(p => ({...p, titleLetterSpacing: v}))} />
                    <RangeControl label="Subtitle Size" value={config.subtitleSize} min={40} max={150} onChange={v => setConfig(p => ({...p, subtitleSize: v}))} />
                    <RangeControl label="Subtitle Letter Spacing" value={config.subtitleLetterSpacing || 0} min={-10} max={100} onChange={v => setConfig(p => ({...p, subtitleLetterSpacing: v}))} />
                    <RangeControl label="Outline Weight" value={config.strokeWidth} min={1} max={30} onChange={v => setConfig(p => ({...p, strokeWidth: v}))} />
                    <ColorOverride title="Manual Colors" element="title" config={config} toggle={() => setConfig(p => ({...p, manualColors: {...p.manualColors, title: !p.manualColors.title}}))} onChange={(el, k, v) => setConfig(p => ({...p, colors: {...p.colors, [`${el}${k}`]: v}}))} />
                  </div>
                )}
                {selEl === 'stream' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-12 lg:pb-4">
                    <div className="flex gap-2 mb-4">
                      <button onClick={() => setConfig(p => ({...p, streamBold: !p.streamBold}))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition shadow flex items-center justify-center gap-1.5 ${config.streamBold ? 'bg-blue-600' : 'bg-white/10'}`}><Bold size={16} /> Bold</button>
                      <button onClick={() => setConfig(p => ({...p, streamItalic: !p.streamItalic}))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition shadow flex items-center justify-center gap-1.5 ${config.streamItalic ? 'bg-blue-600' : 'bg-white/10'}`}><Italic size={16} /> Italic</button>
                    </div>
                    <RangeControl label="Scale" value={config.streamCountSize} min={40} max={280} onChange={v => setConfig(p => ({...p, streamCountSize: v}))} />
                    <RangeControl label="Letter Spacing" value={config.streamCountLetterSpacing || 0} min={-10} max={100} onChange={v => setConfig(p => ({...p, streamCountLetterSpacing: v}))} />
                    <ColorOverride title="Manual Colors" element="stream" config={config} toggle={() => setConfig(p => ({...p, manualColors: {...p.manualColors, streamCount: !p.manualColors.streamCount}}))} onChange={(el, k, v) => setConfig(p => ({...p, colors: {...p.colors, [`${el}${k}`]: v}}))} />
                  </div>
                )}
                {selEl === 'cycle' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-12 lg:pb-4">
                    <div className="flex gap-2 mb-4">
                      <button onClick={() => setConfig(p => ({...p, cycleBold: !p.cycleBold}))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition shadow flex items-center justify-center gap-1.5 ${config.cycleBold ? 'bg-blue-600' : 'bg-white/10'}`}><Bold size={16} /> Bold</button>
                      <button onClick={() => setConfig(p => ({...p, cycleItalic: !p.cycleItalic}))} className={`flex-1 py-2 rounded-lg text-sm font-medium transition shadow flex items-center justify-center gap-1.5 ${config.cycleItalic ? 'bg-blue-600' : 'bg-white/10'}`}><Italic size={16} /> Italic</button>
                    </div>
                    <RangeControl label="Scale" value={config.cycleSize} min={30} max={220} onChange={v => setConfig(p => ({...p, cycleSize: v}))} />
                    <RangeControl label="Letter Spacing" value={config.cycleLetterSpacing || 0} min={-10} max={100} onChange={v => setConfig(p => ({...p, cycleLetterSpacing: v}))} />
                    <ColorOverride title="Manual Colors" element="cycle" config={config} toggle={() => setConfig(p => ({...p, manualColors: {...p.manualColors, cycle: !p.manualColors.cycle}}))} onChange={(el, k, v) => setConfig(p => ({...p, colors: {...p.colors, [`${el}${k}`]: v}}))} />
                  </div>
                )}
                {selEl === 'layout' && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-12 lg:pb-4">
                    <RangeControl label="Background Zoom" value={config.bgZoom || 100} min={10} max={300} onChange={v => setConfig(p => ({...p, bgZoom: v}))} />
                    <RangeControl label="Title Y Offset" value={config.titleYOffset} min={10} max={550} onChange={v => setConfig(p => ({...p, titleYOffset: v}))} />
                    <RangeControl label="Title Spacing" value={config.titleSpacing} min={0} max={300} onChange={v => setConfig(p => ({...p, titleSpacing: v}))} />
                    <button onClick={() => setConfig(p => ({...p, showBottomShadow: !p.showBottomShadow}))} className={`w-full py-2 rounded-lg text-xs font-medium transition shadow ${config.showBottomShadow ? 'bg-emerald-600' : 'bg-white/10'}`}>Toggle Shadow</button>
                    <RangeControl label="Left/Right Margin" value={config.bottomPaddingX} min={0} max={900} onChange={v => setConfig(p => ({...p, bottomPaddingX: v}))} />
                    <RangeControl label="Bottom Margin" value={config.bottomPaddingY} min={0} max={600} onChange={v => setConfig(p => ({...p, bottomPaddingY: v}))} />
                    <RangeControl label="Label Gap" value={config.bottomSpacing} min={0} max={300} onChange={v => setConfig(p => ({...p, bottomSpacing: v}))} />
                  </div>
                )}
                {selEl === 'font' && (
                  <div className="flex-none lg:flex-1 flex flex-col lg:overflow-hidden p-4 space-y-4 pb-12 lg:pb-4">
                    <button 
                      onClick={() => window.open('https://fonts.google.com', '_blank')} 
                      className="w-full bg-white/5 hover:bg-white/10 rounded-lg p-3 transition flex items-center justify-center gap-2 text-sm shadow border border-white/5 font-medium shrink-0"
                    >
                      <Globe size={18} className="text-blue-400" /> Browse Google Fonts
                    </button>

                    <div className="flex gap-2 shrink-0">
                      <input 
                        type="text" 
                        placeholder="Paste <link> embed code or URL..." 
                        value={embedCode} 
                        onChange={e => setEmbedCode(e.target.value)}
                        className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-inner min-w-0"
                      />
                      <button onClick={handleAddGoogleFont} className="bg-blue-600 hover:bg-blue-500 px-3 rounded-lg transition shadow-lg flex items-center justify-center shrink-0">
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4 flex-1 flex flex-col min-h-0">
                      <label className="text-xs text-white/50 uppercase font-bold tracking-wider block mb-3 shrink-0">
                        Font Gallery (Current: <span className="text-white">{cF || 'System'}</span>)
                      </label>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 pb-4">
                        <div 
                          onClick={() => setCF(null)}
                          className={`relative border rounded-lg p-4 cursor-pointer transition ${cF === null ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-black/40 hover:bg-white/5'}`}
                        >
                          <span className="text-lg block font-sans font-medium text-white/80">System Default Font</span>
                        </div>

                        {displayFonts.map((font, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setCF(font.family)}
                            className={`relative group border rounded-lg p-4 cursor-pointer transition ${cF === font.family ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-black/40 hover:bg-white/5'}`}
                          >
                            <span style={{ fontFamily: font.isLocal ? `"${font.family}"` : `"${font.family}", sans-serif` }} className="text-lg block truncate pr-16">
                              {font.family}
                            </span>
                            {!font.isLocal && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFont(font.family); }} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                            {font.isLocal && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/40 uppercase font-bold px-2 py-1 bg-black/40 rounded">Local</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
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
        
        {confirmFontDialog && (
          <ConfirmBanner
            title={confirmFontDialog.title}
            message={confirmFontDialog.message}
            onConfirm={confirmFontDialog.onConfirm}
            onCancel={() => setConfirmFontDialog(null)}
          />
        )}
      </div>
    </>
  );
}