// src/components/DataManager.jsx
import React, { useState } from 'react';
import { Type, Layout, Eye, AlertTriangle, Trash2, X, RefreshCw, Loader2 } from 'lucide-react';
import { RangeControl } from './common/UIComponents';

const Toggle = ({ label, description, value, onChange, warning }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
    <div className="flex justify-between items-center">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-white/40 mt-0.5 pr-4 leading-tight">{description}</div>
      </div>
      <button onClick={() => onChange(!value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 ${value ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'}`}>
        {value ? 'Enabled' : 'Disabled'}
      </button>
    </div>
    {warning && <p className="text-[10px] text-amber-400/70 leading-tight pt-1">{warning}</p>}
  </div>
);

export default function DataManager({ 
  systemFonts, setSystemFonts, 
  layoutPrefs, setLayoutPrefs, 
  modalBgIntensity, setModalBgIntensity, 
  modalPanelOpacity, setModalPanelOpacity,
  persistSettings, setPersistSettings,
  onWipeData,
  onRunSync,
  isSyncing
}) {
  const [showWipeModal, setShowWipeModal] = useState(false);

  const updateFont = (key, val) => setSystemFonts(prev => ({ ...prev, [key]: val }));
  const updateLayout = (key, val) => setLayoutPrefs(prev => ({ ...prev, [key]: val }));

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-8">
      <div className="max-w-7xl mx-auto relative pb-20">
        
        {/* Persistence Toggle */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Persistent Styling</h3>
            <p className="text-sm text-white/60 mt-1">If enabled, your style and layout preferences will be saved in your browser memory. Turn off to easily reset everything to defaults on the next page refresh.</p>
          </div>
          <button 
            onClick={() => setPersistSettings(!persistSettings)} 
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md whitespace-nowrap shrink-0 ${persistSettings ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white/60'}`}
          >
            {persistSettings ? 'ON (Saving Settings)' : 'OFF (Reset on Reload)'}
          </button>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2 pt-2"><Type size={24} /> Typography: Cards (History & Library)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          <RangeControl label="Game Title" description="Font size of game name" value={systemFonts.libTitle} min={8} max={64} onChange={v => updateFont('libTitle', v)} />
          <RangeControl label="Subtext (Year/Run)" description="Font size of the subtext" value={systemFonts.libYear} min={8} max={48} onChange={v => updateFont('libYear', v)} />
          <RangeControl label="Timestamp (History)" description="Font size of history timestamp" value={systemFonts.dashboardTime || 10} min={6} max={32} onChange={v => updateFont('dashboardTime', v)} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2"><Type size={24} /> Typography: Modals & Other</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          <RangeControl label="Modal Game Name" description="Header inside game profile" value={systemFonts.modalHeader} min={16} max={96} onChange={v => updateFont('modalHeader', v)} />
          <RangeControl label="Log Entry Title" description="'Livestream #X' text" value={systemFonts.logTitle} min={10} max={48} onChange={v => updateFont('logTitle', v)} />
          <RangeControl label="Log Timestamp" description="Date/time below each log" value={systemFonts.logSub} min={8} max={32} onChange={v => updateFont('logSub', v)} />
          <RangeControl label="Search Input Text" description="Font size of search bar" value={systemFonts.searchBar} min={12} max={48} onChange={v => updateFont('searchBar', v)} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2"><Type size={24} /> Typography: Stats Page</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          <RangeControl label="Main Counts" description="Streams & Games count size" value={systemFonts.statsMainCount ?? 4.5} min={1} max={15} step={0.1} onChange={v => updateFont('statsMainCount', v)} />
          <RangeControl label="Main Labels" description="'Streams' & 'Games in Library' text" value={systemFonts.statsMainLabel ?? 1.1} min={0.5} max={5} step={0.1} onChange={v => updateFont('statsMainLabel', v)} />
          <RangeControl label="Latest Game Title" description="Size of the latest game name" value={systemFonts.statsTitle ?? 2.2} min={0.5} max={10} step={0.1} onChange={v => updateFont('statsTitle', v)} />
          <RangeControl label="Subtexts & Details" description="Size of times, dates, and run names" value={systemFonts.statsSub ?? 1.1} min={0.5} max={5} step={0.1} onChange={v => updateFont('statsSub', v)} />
          <RangeControl label="Category Labels" description="Size of category game names" value={systemFonts.statsLabel ?? 1.1} min={0.5} max={5} step={0.1} onChange={v => updateFont('statsLabel', v)} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2"><Layout size={24} /> Layout & Spacing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          <RangeControl label="Modal Split (Left Column %)" description="Balance between game details and runs/logs" value={(layoutPrefs.modalSplitRatio || 0.6) * 100} min={20} max={80} onChange={v => updateLayout('modalSplitRatio', v / 100)} />
          <RangeControl label="Stats Width Split (Left %)" description="Top row left/right ratio" value={(layoutPrefs.statsSplitRatio ?? 0.35) * 100} min={10} max={90} onChange={v => updateLayout('statsSplitRatio', v / 100)} />
          <RangeControl label="Stats Height Split (Top %)" description="Top row vs Category rows ratio" value={(layoutPrefs.statsRowSplitRatio ?? 0.6) * 100} min={20} max={80} onChange={v => updateLayout('statsRowSplitRatio', v / 100)} />
          <RangeControl label="Card Padding" description="Space inside card (text area)" value={layoutPrefs.cardPadding} min={0} max={64} onChange={v => updateLayout('cardPadding', v)} />
          <RangeControl label="Card Gap" description="Space between cards" value={layoutPrefs.cardGap} min={0} max={64} onChange={v => updateLayout('cardGap', v)} />
          <RangeControl label="Card Base Width" description="Minimum width of cards before wrapping" value={layoutPrefs.cardMaxWidth || 250} min={150} max={600} onChange={v => updateLayout('cardMaxWidth', v)} />
          <RangeControl label="Page Horizontal Padding" description="Left/right margin of content" value={layoutPrefs.containerPaddingX} min={0} max={128} onChange={v => updateLayout('containerPaddingX', v)} />
          <RangeControl label="Page Vertical Padding" description="Top/bottom margin of content" value={layoutPrefs.containerPaddingY} min={0} max={128} onChange={v => updateLayout('containerPaddingY', v)} />
          
          <Toggle label="Rounded Cards" description="Enable rounded corners on cards" value={layoutPrefs.cardRounded} onChange={v => updateLayout('cardRounded', v)} />
          <RangeControl label="Card Border Radius" description="How rounded the cards are" value={layoutPrefs.cardRadius} min={0} max={64} onChange={v => updateLayout('cardRadius', v)} disabled={!layoutPrefs.cardRounded} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2"><Eye size={24} /> UI Visibility & Opacity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          
          <Toggle 
            label="Fluid Animations" 
            description="Smooth morphing between views and sorting."
            warning="Disable this if your page feels laggy during sorting or view switching."
            value={layoutPrefs.enableViewTransitions ?? true} 
            onChange={v => updateLayout('enableViewTransitions', v)} 
          />

          <Toggle 
            label="High-Resolution Images" 
            description="Use full-quality 1080p/4K images. Disable to force lower-res thumbnails (saves RAM/bandwidth on older devices)." 
            value={layoutPrefs.highResImages || false} 
            onChange={v => updateLayout('highResImages', v)} 
          />
          
          <Toggle 
            label="3D Hover Effects" 
            description="Toggles the flipping mosaic background on hover. If disabled, clicking a card once previews it, and clicking twice opens it (saves performance on lower-end computers)." 
            value={layoutPrefs.enableHoverEffects !== false} 
            onChange={v => updateLayout('enableHoverEffects', v)} 
          />

          <RangeControl label="Card Panel Opacity" description="Transparency of game cards (History, Library, Add)" value={layoutPrefs.panelFillOpacity ?? 0.1} min={0} max={1} step={0.01} onChange={v => updateLayout('panelFillOpacity', v)} />
          <RangeControl label="App Background Dimming" description="Opacity of the dark overlay on the background" value={layoutPrefs.bgDimming ?? 0.5} min={0} max={1} step={0.01} onChange={v => updateLayout('bgDimming', v)} />
          <RangeControl label="Modal Panel Opacity" description="Transparency of Runs & Logs panels" value={modalPanelOpacity} min={0} max={1} step={0.01} onChange={setModalPanelOpacity} />
          <RangeControl label="Modal Background Blur" description="0 = clear, 1 = maximum blur" value={modalBgIntensity} min={0} max={1} step={0.01} onChange={setModalBgIntensity} />
          <RangeControl label="Hover Image Cycle Speed" description="Card thumbnail slideshow interval (ms)" value={layoutPrefs.hoverCycleInterval ?? 1500} min={500} max={10000} step={100} onChange={v => updateLayout('hoverCycleInterval', v)} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2"><RefreshCw size={24} /> Data Synchronization</h2>
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 mb-12 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Sync Library Data</h3>
            <p className="text-sm text-white/60 mt-1">Manually scan your library to fetch missing Steam URLs, update game details, and normalize developer/publisher names.</p>
          </div>
          <button 
            onClick={onRunSync} 
            disabled={isSyncing}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md whitespace-nowrap shrink-0 flex items-center justify-center gap-2 ${isSyncing ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
          >
            {isSyncing ? <><Loader2 size={16} className="animate-spin" /> Syncing...</> : <><RefreshCw size={16} /> Run Sync</>}
          </button>
        </div>

        {/* Danger Zone */}
        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2 text-red-500 mt-16"><AlertTriangle size={24} /> Danger Zone</h2>
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Wipe Application Data</h3>
            <p className="text-sm text-red-200/70 mt-1">Permanently delete your stream history, settings, or both. A backup will be downloaded automatically before deletion.</p>
          </div>
          <button 
            onClick={() => setShowWipeModal(true)} 
            className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md whitespace-nowrap shrink-0 bg-red-600 hover:bg-red-500 text-white"
          >
            <Trash2 size={16} className="inline mr-2" /> Delete Data
          </button>
        </div>

      </div>

      {showWipeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWipeModal(false)}>
          <div className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3 bg-red-950/90 border border-red-500/30" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><AlertTriangle size={20} className="text-red-400"/> Delete Data</h3>
              <button onClick={() => setShowWipeModal(false)} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"><X size={20} /></button>
            </div>
            <p className="text-sm text-white/70 mb-4">Choose what you want to delete. <strong className="text-white">A backup will be saved to your device first.</strong></p>
            <button onClick={() => { onWipeData('full'); setShowWipeModal(false); }} className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-lg font-medium text-white transition-colors shadow-lg">Delete Stream Data + Settings</button>
            <button onClick={() => { onWipeData('stream'); setShowWipeModal(false); }} className="w-full bg-red-800/60 hover:bg-red-700/60 py-3 rounded-lg font-medium text-white transition-colors border border-red-500/30">Delete Stream Data Only</button>
            <button onClick={() => { onWipeData('settings'); setShowWipeModal(false); }} className="w-full bg-red-800/60 hover:bg-red-700/60 py-3 rounded-lg font-medium text-white transition-colors border border-red-500/30">Delete Settings Only</button>
          </div>
        </div>
      )}

    </div>
  );
}