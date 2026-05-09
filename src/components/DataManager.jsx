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

export default function DataManager({ systemFonts, setSystemFonts, layoutPrefs, setLayoutPrefs, modalBgIntensity, setModalBgIntensity, modalPanelOpacity, setModalPanelOpacity, thumbnailConfig }) {
  const updateFont = (key, val) => setSystemFonts(prev => ({ ...prev, [key]: val }));
  const updateLayout = (key, val) => setLayoutPrefs(prev => ({ ...prev, [key]: val }));

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-8">
      <div className="max-w-7xl mx-auto relative">
        
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

        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2"><Layout size={24} /> Layout & Spacing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          <RangeControl label="Card Padding" description="Space inside card (text area)" value={layoutPrefs.cardPadding} min={0} max={64} onChange={v => updateLayout('cardPadding', v)} />
          <RangeControl label="Card Gap" description="Space between cards" value={layoutPrefs.cardGap} min={0} max={64} onChange={v => updateLayout('cardGap', v)} />
          <RangeControl label="Card Max Width" description="Maximum width of each card" value={layoutPrefs.cardMaxWidth} min={150} max={600} onChange={v => updateLayout('cardMaxWidth', v)} />
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