import React from 'react';
import { Type, Layout, Eye, Monitor } from 'lucide-react';
import { RangeControl } from './common/UIComponents';

const SectionHeader = ({ icon: Icon, title }) => (
  <h2 className="text-xl font-bold tracking-tight mb-6 mt-10 flex items-center gap-2 text-blue-400">
    <Icon size={22} /> {title}
  </h2>
);

const Toggle = ({ label, description, value, onChange }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
    <div className="flex justify-between items-center">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-white/40 mt-0.5">{description}</div>
      </div>
      <button 
        onClick={() => onChange(!value)} 
        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${value ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60'}`}
      >
        {value ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  </div>
);

export default function DataManager({ 
  systemFonts, setSystemFonts, layoutPrefs, setLayoutPrefs, 
  modalBgIntensity, setModalBgIntensity, modalPanelOpacity, setModalPanelOpacity 
}) {
  const updateFont = (key, val) => setSystemFonts(prev => ({ ...prev, [key]: val }));
  const updateLayout = (key, val) => setLayoutPrefs(prev => ({ ...prev, [key]: val }));

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 py-8 bg-black/20">
      <div className="max-w-5xl mx-auto">
        
        {/* GLOBAL BRANDING */}
        <SectionHeader icon={Monitor} title="Global Interface" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RangeControl label="Background Dimming" description="Overall app backdrop darkness" value={layoutPrefs.bgDimming ?? 0.6} min={0} max={1} step={0.05} onChange={v => updateLayout('bgDimming', v)} />
          <RangeControl label="Slideshow Speed" description="Image swap interval (ms)" value={layoutPrefs.cycleInterval ?? 4000} min={1000} max={15000} step={500} onChange={v => updateLayout('cycleInterval', v)} />
          <RangeControl label="Search Bar Font" value={systemFonts.searchBar} min={14} max={48} onChange={v => updateFont('searchBar', v)} />
        </div>

        {/* CARD GRID SETTINGS */}
        <SectionHeader icon={Layout} title="Card Grid Settings" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RangeControl label="Cards Per Row" description="Number of columns on large screens" value={layoutPrefs.cardsPerRow ?? 5} min={1} max={10} step={1} onChange={v => updateLayout('cardsPerRow', v)} />
          <RangeControl label="Card Max Width" description="Limits card size in flexible grids" value={layoutPrefs.cardMaxWidth ?? 320} min={150} max={600} onChange={v => updateLayout('cardMaxWidth', v)} />
          <RangeControl label="Grid Spacing" value={layoutPrefs.cardGap ?? 16} min={8} max={48} onChange={v => updateLayout('cardGap', v)} />
          <RangeControl label="Inner Card Padding" value={layoutPrefs.cardPadding ?? 16} min={8} max={40} onChange={v => updateLayout('cardPadding', v)} />
          <RangeControl label="Card Opacity" description="Transparency of the card body" value={layoutPrefs.panelFillOpacity ?? 0.2} min={0} max={1} step={0.05} onChange={v => updateLayout('panelFillOpacity', v)} />
          
          <div className="space-y-4">
            <Toggle label="Enable Roundness" description="Toggle card corner rounding" value={layoutPrefs.cardRounded ?? true} onChange={v => updateLayout('cardRounded', v)} />
            <RangeControl label="Corner Radius" value={layoutPrefs.cardRadius ?? 12} min={0} max={40} onChange={v => updateLayout('cardRadius', v)} disabled={!layoutPrefs.cardRounded} />
          </div>
        </div>

        {/* CARD TYPOGRAPHY */}
        <SectionHeader icon={Type} title="Card Typography" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RangeControl label="Game Title Size" value={systemFonts.libTitle} min={12} max={40} onChange={v => updateFont('libTitle', v)} />
          <RangeControl label="Subtext Size" description="Year and session count info" value={systemFonts.libYear} min={10} max={24} onChange={v => updateFont('libYear', v)} />
        </div>

        {/* GAME PROFILE MODAL */}
        <SectionHeader icon={Eye} title="Game Profile Modal" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RangeControl label="Modal Column Split" description="Ratio between Left (Info) and Right (Runs)" value={layoutPrefs.modalSplitRatio ?? 0.6} min={0.3} max={0.7} step={0.01} onChange={v => updateLayout('modalSplitRatio', v)} />
          <RangeControl label="Panel Transparency" description="Glass effect on the info panels" value={modalPanelOpacity} min={0.2} max={1} step={0.05} onChange={setModalPanelOpacity} />
          <RangeControl label="Backdrop Visibility" description="How much of the game art is visible" value={modalBgIntensity} min={0} max={1} step={0.05} onChange={setModalBgIntensity} />
          <RangeControl label="Header Font Size" value={systemFonts.modalHeader} min={20} max={64} onChange={v => updateFont('modalHeader', v)} />
          <RangeControl label="Session Log Title" value={systemFonts.logTitle} min={14} max={28} onChange={v => updateFont('logTitle', v)} />
          <RangeControl label="Session Log Subtext" value={systemFonts.logSub} min={10} max={18} onChange={v => updateFont('logSub', v)} />
        </div>

        {/* PAGE MARGINS */}
        <SectionHeader icon={Layout} title="Page Margins" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          <RangeControl label="Horizontal Margin" value={layoutPrefs.containerPaddingX ?? 40} min={0} max={120} onChange={v => updateLayout('containerPaddingX', v)} />
          <RangeControl label="Vertical Margin" value={layoutPrefs.containerPaddingY ?? 32} min={0} max={120} onChange={v => updateLayout('containerPaddingY', v)} />
        </div>
        
      </div>
    </div>
  );
}