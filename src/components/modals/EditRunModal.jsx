// src/components/modals/EditRunModal.jsx
import React, { useState, useCallback } from 'react';
import { X, Save, Star, RefreshCw, Loader2, PlayCircle } from 'lucide-react';
import { formatRunName } from '../../utils/helpers';
import { fetchPlaylistDetails } from '../../utils/youtubeUtils';

// Helper to convert string to sentence case
const toSentenceCase = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const EditRunModal = ({ runName, isMain, youtubePlaylist, currentLabel, currentPlaylistData, onSave, onClose }) => {
  const [name, setName] = useState(runName);
  const [main, setMain] = useState(isMain);
  const [playlist, setPlaylist] = useState(youtubePlaylist || '');
  const [label, setLabel] = useState(currentLabel || 'Ongoing');
  
  const [playlistData, setPlaylistData] = useState(currentPlaylistData || null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleNameChange = (e) => {
    let raw = e.target.value;
    if (raw.length === 1) {
      raw = raw.toLocaleUpperCase();
    } else if (raw.length > 1 && raw[0] !== raw[0].toUpperCase()) {
      raw = raw[0].toLocaleUpperCase() + raw.slice(1).toLocaleLowerCase();
    }
    setName(raw);
  };

  const handleBlur = () => {
    setName(toSentenceCase(name));
  };

  const handleSyncPlaylist = async () => {
    if (!playlist.trim()) {
      setSyncStatus({ text: "Please enter a valid playlist URL.", type: "error" });
      return;
    }
    setIsSyncing(true);
    setSyncStatus({ text: "Syncing with YouTube...", type: "info" });
    
    const data = await fetchPlaylistDetails(playlist.trim());
    
    if (data) {
      setPlaylistData(data);
      setSyncStatus({ text: `Success! Found ${data.videos.length} videos. Total time: ${data.totalRuntime}`, type: "success" });
    } else {
      setSyncStatus({ text: "Failed to fetch playlist. Check URL or API key.", type: "error" });
    }
    setIsSyncing(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    // Pass playlistData back alongside the other fields
    onSave(formatRunName(name.trim()), main, playlist, label, playlistData);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Edit Run</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white"><X size={20} /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/50 block mb-1">Run Name</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              onBlur={handleBlur}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setMain(!main)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                main ? 'bg-yellow-500/80 text-black' : 'bg-white/10 text-white/60'
              }`}
            >
              <Star size={14} /> {main ? 'Main Run' : 'Set as Main'}
            </button>
            <span className="text-xs text-white/40">Main run name is omitted from stream title</span>
          </div>
          
          <div>
            <label className="text-sm text-white/50 block mb-1">Status Label</label>
            <select
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Abandoned">Abandoned</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-white/50 block mb-1">YouTube Playlist (for this run)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={playlist}
                onChange={e => setPlaylist(e.target.value)}
                placeholder="https://youtube.com/playlist?list=..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
              />
              <button 
                onClick={handleSyncPlaylist}
                disabled={isSyncing}
                className={`bg-white/10 hover:bg-white/20 p-2 rounded-lg transition shrink-0 border border-white/10 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Sync Runtime Data"
              >
                {isSyncing ? <Loader2 size={20} className="animate-spin text-white" /> : <RefreshCw size={20} className="text-red-400" />}
              </button>
            </div>
            
            {syncStatus && (
              <p className={`text-xs mt-2 ${syncStatus.type === 'error' ? 'text-red-400' : syncStatus.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}`}>
                {syncStatus.text}
              </p>
            )}
            {!syncStatus && playlistData && (
              <p className="text-xs mt-2 text-emerald-400 flex items-center gap-1">
                <PlayCircle size={12}/> Synced: {playlistData.videos.length} videos, {playlistData.totalRuntime}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-white"
          >
            <Save size={16} /> Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};