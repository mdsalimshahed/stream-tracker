// src/App.jsx
import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

// Hooks
import { useSettings } from './hooks/useSettings';
import { useStreamData } from './hooks/useStreamData';
import { useHover } from './hooks/useHover';
import { useScaling } from './hooks/useScaling';
import { useSearch } from './hooks/useSearch';

// Utilities (Add this line)
import { migrateLabels } from './utils/dataUtils';

// Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import DataManager from './components/DataManager';
import GameProfileModal from './components/GameProfileModal';
import LivestreamSetupWorkspace from './components/LivestreamSetupWorkspace';
import Stats from './components/Stats';
import SearchView from './components/SearchView';
import MosaicBackground from './components/background/MosaicBackground.jsx';
import { Notification } from './components/Notification';
import { CrossfadeImage } from './components/common/UIComponents';

export default function App() {
  const [toast, setToast] = useState(null);
  const notify = (msg, type) => setToast({ message: msg, type });

  // --- Hooks ---
  const settings = useSettings();
  const { streamData, setStreamData, isSyncing, handleManualSync, handleAddGame, updateGameLink, editGameDetails, deleteGame, deleteCycle, deleteTimestamp, updateCycle, addCycle } = useStreamData(notify);
  const { scaledSystemFonts, scaledLayoutPrefs } = useScaling(settings.systemFonts, settings.layoutPrefs);
  const { searchQuery, setSearchQuery, searchResults, isSearching, handleSearch } = useSearch();

  // --- Navigation ---
  const [currentView, setCurrentView] = useState(() => {
    try { const s = localStorage.getItem('streamManagerData'); if (s && Object.keys(JSON.parse(s)).length > 0) return 'dashboard'; } catch (e) {}
    return 'data';
  });

  // --- Modals ---
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [initialRunForModal, setInitialRunForModal] = useState(null);
  const [workspaceConfig, setWorkspaceConfig] = useState(null); // { gameId, cycleId, selectedStreamNumber }
  const [showExportModal, setShowExportModal] = useState(false);

  const isModalOpen = !!(selectedGameId || workspaceConfig);
  const openGameProfile = (gameId, runId = null) => { setSelectedGameId(gameId); setInitialRunForModal(runId); };

  // --- Hover ---
  const { hoveredImage, hoverState, mosaicPaused, onHoverGame, handleCardClick } = useHover({
    streamData, isModalOpen, layoutPrefs: settings.layoutPrefs,
  });

  // --- Mosaic images ---
  const mosaicImages = useMemo(() =>
    Object.entries(streamData).flatMap(([id, g]) =>
      (g.thumbnail_urls || []).filter(Boolean).map(url => ({ url, gameId: id }))
    ), [streamData]);

  // --- Background image logic ---
  const isImageReady = hoverState.gameId && hoveredImage.gameId === hoverState.gameId;
  let currentBgUrl = '';
  if (hoverState.gameId) {
    currentBgUrl = isImageReady ? hoveredImage.url : (streamData[hoverState.gameId]?.cover_image || streamData[hoverState.gameId]?.thumbnail_urls?.[0] || '');
  } else {
    currentBgUrl = hoveredImage.url; // retain for fade-out
  }

  // --- Import / Export ---
  // --- Import / Export ---
  const handleImport = (importedData) => {
    try {
      const isSettingsOnly = importedData.type === 'settings_only';
      const isFullBackup = !isSettingsOnly && (importedData.type === 'full_backup' || importedData.streamData !== undefined);
      
      if (isFullBackup || (!isSettingsOnly && !isFullBackup)) {
        const dataToMigrate = isFullBackup ? importedData.streamData : importedData;
        setStreamData(migrateLabels(dataToMigrate).data);
      }
      
      if (isFullBackup || isSettingsOnly) {
        if (importedData.thumbnailConfig) settings.setThumbnailConfig(importedData.thumbnailConfig);
        if (importedData.systemFonts) settings.setSystemFonts(importedData.systemFonts);
        if (importedData.layoutPrefs) settings.setLayoutPrefs(importedData.layoutPrefs);
        if (importedData.modalBgIntensity !== undefined) settings.setModalBgIntensity(importedData.modalBgIntensity);
        if (importedData.modalPanelOpacity !== undefined) settings.setModalPanelOpacity(importedData.modalPanelOpacity);
      }
      
      notify('Data imported successfully!', 'success');
    } catch (e) { 
      console.error(e);
      notify('Failed to parse import file', 'error'); 
    }
  };

  const handleExport = (type) => {
    const now = new Date();
    
    // Build a local date string (YYYY-MM-DD_HH-MM-SS)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    
    let exportData = { version: '2.0.0', exportDate: now.toLocaleString() };
    let fileName = '';

    if (type === 'stream') { 
      exportData = streamData; 
      fileName = `streamtracker_stream_data_${dateStr}.json`; 
    }
    else if (type === 'settings') { 
      exportData = { 
        ...exportData, 
        type: 'settings_only', 
        thumbnailConfig: settings.thumbnailConfig, 
        systemFonts: settings.systemFonts, 
        layoutPrefs: settings.layoutPrefs, 
        modalBgIntensity: settings.modalBgIntensity, 
        modalPanelOpacity: settings.modalPanelOpacity 
      }; 
      fileName = `streamtracker_settings_${dateStr}.json`; 
    }
    else { 
      exportData = { 
        ...exportData, 
        type: 'full_backup', 
        streamData, 
        thumbnailConfig: settings.thumbnailConfig, 
        systemFonts: settings.systemFonts, 
        layoutPrefs: settings.layoutPrefs, 
        modalBgIntensity: settings.modalBgIntensity, 
        modalPanelOpacity: settings.modalPanelOpacity 
      }; 
      fileName = `streamtracker_full_backup_${dateStr}.json`; 
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(blob); 
    link.download = fileName; 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  const handleWipeData = (type) => {
    handleExport(type);
    setTimeout(() => {
      if (type === 'stream' || type === 'full') setStreamData({});
      if (type === 'settings' || type === 'full') settings.resetSettings();
      notify(`Deleted and backed up ${type === 'full' ? 'all' : type} data.`, 'success');
    }, 500);
  };

  const handleImportDefault = (type = 'full') => {
    fetch('defaultData.json').then(res => { if (res.ok) return res.json(); throw new Error(); })
      .then(data => { data.type = type === 'settings' ? 'settings_only' : 'full_backup'; handleImport(data); })
      .catch(() => notify('Could not find defaultData.json', 'error'));
  };

  // --- Add game wrapper (opens profile after add) ---
  const onAddGame = async (g) => {
    const rid = g.id.toString();
    if (streamData[rid]) { openGameProfile(rid); setCurrentView('library'); return; }
    const newId = await handleAddGame(g);
    if (newId) openGameProfile(newId);
  };

  // --- Shared card props ---
  const cardProps = { streamData, hoveredImage, hoverState, onHoverGame, systemFonts: scaledSystemFonts, layoutPrefs: scaledLayoutPrefs };

  const makeHandleCardClick = (cycleId = null) => (e, uniqueCardId, gameId) =>
    handleCardClick(e, uniqueCardId, gameId, openGameProfile, cycleId);

  return (
    <div className="min-h-screen text-white font-sans antialiased relative bg-black overflow-hidden flex flex-col">
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px;height:8px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:#555;border-radius:8px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#888}.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      {/* Background layer */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-black">
        <div className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${isImageReady ? 'opacity-100' : 'opacity-0'}`}>
          <CrossfadeImage src={currentBgUrl} className="absolute inset-0 w-full h-full" imgClassName="object-cover" />
        </div>
        <div className="absolute inset-0 z-10">
          <MosaicBackground mosaicImages={mosaicImages} isPaused={mosaicPaused} isSlowMode={currentView !== 'stats'} shouldFlip={isImageReady} />
        </div>
        <div className="absolute inset-0 bg-black transition-opacity duration-300 z-20 pointer-events-none" style={{ opacity: settings.layoutPrefs.bgDimming ?? 0.5 }} />
      </div>

      {/* App shell */}
      <div className="relative z-20 flex flex-col h-screen">
        <Header currentView={currentView} onViewChange={setCurrentView} onImport={handleImport} onExport={() => setShowExportModal(true)} />

        <main key={currentView} className="page-transition flex-1 overflow-hidden flex flex-col relative">
          {currentView === 'data' && (
            <div className="flex flex-col h-full overflow-hidden bg-black/40 backdrop-blur-xl">
              <DataManager
                systemFonts={settings.systemFonts} setSystemFonts={settings.setSystemFonts}
                layoutPrefs={settings.layoutPrefs} setLayoutPrefs={settings.setLayoutPrefs}
                modalBgIntensity={settings.modalBgIntensity} setModalBgIntensity={settings.setModalBgIntensity}
                modalPanelOpacity={settings.modalPanelOpacity} setModalPanelOpacity={settings.setModalPanelOpacity}
                persistSettings={settings.persistSettings} setPersistSettings={settings.setPersistSettings}
                onWipeData={handleWipeData} onRunSync={handleManualSync} isSyncing={isSyncing}
              />
            </div>
          )}
          {currentView === 'dashboard' && (
            <Dashboard {...cardProps} handleCardClick={(e, id, gid, cid) => handleCardClick(e, id, gid, openGameProfile, cid)} onImportDefault={handleImportDefault} hasCustomSettings={settings.hasCustomSettings} />
          )}
          {currentView === 'library' && (
            <Library {...cardProps} handleCardClick={(e, id, gid) => handleCardClick(e, id, gid, openGameProfile)} onDeleteGame={deleteGame} onUpdateGameLink={updateGameLink} onEditGame={editGameDetails} onImportDefault={handleImportDefault} hasCustomSettings={settings.hasCustomSettings} />
          )}
          {currentView === 'stats' && (
            <Stats streamData={streamData} systemFonts={scaledSystemFonts} layoutPrefs={scaledLayoutPrefs} />
          )}
          {currentView === 'search' && (
            <SearchView
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              searchResults={searchResults} isSearching={isSearching} handleSearch={handleSearch}
              handleAddGame={onAddGame} streamData={streamData}
              scaledSystemFonts={scaledSystemFonts} scaledLayoutPrefs={scaledLayoutPrefs}
            />
          )}
        </main>
      </div>

      {/* Export modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[4px]" onClick={() => setShowExportModal(false)}>
          <div className="rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-3 bg-black/85 border border-white/10 backdrop-blur-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2"><h3 className="text-xl font-bold text-white">Export Options</h3><button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"><X size={20} /></button></div>
            <p className="text-sm text-white/70 mb-2">Choose what you want to back up or share:</p>
            <button onClick={() => handleExport('full')} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-medium text-white transition-colors shadow-lg">Stream Data + Settings (Full)</button>
            <button onClick={() => handleExport('stream')} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-medium text-white transition-colors border border-white/5">Stream Data Only (Classic)</button>
            <button onClick={() => handleExport('settings')} className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-lg font-medium text-white transition-colors border border-white/5">Settings Only</button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {toast && <Notification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Game Profile Modal */}
      {selectedGameId && (
        <GameProfileModal
          gameId={selectedGameId} gameData={streamData[selectedGameId]} streamData={streamData}
          onClose={() => { setSelectedGameId(null); setInitialRunForModal(null); }}
          onStartWorkspace={(gameId, cycleId, selectedStreamNumber) => { setSelectedGameId(null); setWorkspaceConfig({ gameId, cycleId, selectedStreamNumber }); }}
          onDeleteCycle={deleteCycle} onDeleteTimestamp={deleteTimestamp} onNotify={notify}
          systemFonts={scaledSystemFonts} modalBgIntensity={settings.modalBgIntensity} modalPanelOpacity={settings.modalPanelOpacity}
          initialRunId={initialRunForModal} onUpdateCycle={updateCycle} onAddCycle={addCycle} layoutPrefs={scaledLayoutPrefs}
        />
      )}

      {/* Workspace */}
      {workspaceConfig && (
        <LivestreamSetupWorkspace
          gameId={workspaceConfig.gameId} cycleName={workspaceConfig.cycleId} streamData={streamData}
          onBack={(returnedCycleId) => { setSelectedGameId(workspaceConfig.gameId); setInitialRunForModal(returnedCycleId || workspaceConfig.cycleId); setWorkspaceConfig(null); }}
          onSave={setStreamData} config={settings.thumbnailConfig} setConfig={settings.setThumbnailConfig}
          onNotify={notify} selectedStreamNumber={workspaceConfig.selectedStreamNumber} systemFonts={scaledSystemFonts}
        />
      )}
    </div>
  );
}