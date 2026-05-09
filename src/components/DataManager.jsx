// src/components/DataManager.jsx
import React from 'react';
import { Type, Layout, Eye, Download } from 'lucide-react';
import { RangeControl } from './common/UIComponents';

const Toggle = ({ label, description, value, onChange }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
    <div className="flex justify-between items-center">
      <div><div className="text-sm font-medium text-white">{label}</div><div className="text-xs text-white/40 mt-0.5">{description}</div></div>
      <button onClick={() => onChange(!value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${value ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'}`}>
        {value ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  </div>
);

export default function DataManager({ 
  systemFonts, setSystemFonts, 
  layoutPrefs, setLayoutPrefs, 
  modalBgIntensity, setModalBgIntensity, 
  modalPanelOpacity, setModalPanelOpacity,
  persistSettings, setPersistSettings
}) {
  const updateFont = (key, val) => setSystemFonts(prev => ({ ...prev, [key]: val }));
  const updateLayout = (key, val) => setLayoutPrefs(prev => ({ ...prev, [key]: val }));

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-8">
      <div className="max-w-7xl mx-auto relative">
        
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
          <RangeControl label="Card Panel Opacity" description="Transparency of game cards (History, Library, Add)" value={layoutPrefs.panelFillOpacity ?? 0.1} min={0} max={1} step={0.01} onChange={v => updateLayout('panelFillOpacity', v)} />
          <RangeControl label="App Background Dimming" description="Opacity of the dark overlay on the background" value={layoutPrefs.bgDimming ?? 0.5} min={0} max={1} step={0.01} onChange={v => updateLayout('bgDimming', v)} />
          <RangeControl label="Modal Panel Opacity" description="Transparency of Runs & Logs panels" value={modalPanelOpacity} min={0} max={1} step={0.01} onChange={setModalPanelOpacity} />
          <RangeControl label="Modal Background Dimming" description="0 = fully dimmed, 1 = full visibility" value={modalBgIntensity} min={0} max={1} step={0.01} onChange={setModalBgIntensity} />
          <RangeControl label="Background Cycle Speed" description="Image slideshow interval (ms)" value={layoutPrefs.cycleInterval ?? 4000} min={1000} max={20000} step={500} onChange={v => updateLayout('cycleInterval', v)} />
        </div>
        
      </div>
    </div>
  );
}