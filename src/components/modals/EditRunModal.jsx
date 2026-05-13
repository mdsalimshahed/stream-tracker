// src/components/modals/EditRunModal.jsx
import React, { useState } from 'react';
import { X, Save, Star, RefreshCw, Loader2, Copy, Check } from 'lucide-react';
import { formatRunName, formatDuration } from '../../utils/helpers';
import { fetchPlaylistDetails } from '../../utils/youtubeUtils';

const toSentenceCase = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const EditRunModal = ({ 
  runName, isMain, youtubePlaylist, currentLabel, 
  gameName, releaseYear, 
  existingTimestamps = [], onSave, onClose 
}) => {
  const [name, setName] = useState(runName);
  const [main, setMain] = useState(isMain);
  
  // Create full link on component load if it's just an ID
  const initialPlaylistLink = youtubePlaylist && !youtubePlaylist.includes('http') 
    ? `https://youtube.com/playlist?list=${youtubePlaylist}` 
    : (youtubePlaylist || '');
    
  const [playlist, setPlaylist] = useState(initialPlaylistLink);
  const [label, setLabel] = useState(currentLabel || 'Ongoing');
  
  const [playlistData, setPlaylistData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const [copied, setCopied] = useState(false);
  
  const suggestedTitle = (main || name === 'First Playthrough') 
    ? `${gameName} (${releaseYear})` 
    : `${gameName} (${releaseYear}) — [${name}]`;

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(suggestedTitle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNameChange = (e) => {
    let raw = e.target.value;
    if (raw.length === 1) raw = raw.toLocaleUpperCase();
    else if (raw.length > 1 && raw[0] !== raw[0].toUpperCase()) raw = raw[0].toLocaleUpperCase() + raw.slice(1).toLocaleLowerCase();
    setName(raw);
  };

  const handleSyncPlaylist = async () => {
    if (!playlist.trim()) { setSyncStatus({ text: "Please enter a valid playlist URL.", type: "error" }); return; }
    setIsSyncing(true);
    setSyncStatus({ text: "Syncing with YouTube...", type: "info" });
    
    // Create a lookup map of what we already know to save API quota
    const metaMap = {};
    (existingTimestamps || []).forEach(ts => {
      if (ts.videoId) {
        metaMap[ts.videoId] = { 
          duration: ts.duration, 
          startTime: ts.startTime,
          endTime: ts.endTime,
          title: ts.title 
        };
      }
    });
    
    const videos = await fetchPlaylistDetails(playlist.trim(), metaMap);
    if (videos) {
      setPlaylistData(videos);
      const totalSec = videos.reduce((acc, v) => acc + (v.duration || 0), 0);
      setSyncStatus({ text: `Success! Linked ${videos.length} videos. Total time: ${formatDuration(totalSec)}`, type: "success" });
    } else {
      setSyncStatus({ text: "Failed to fetch playlist. Check URL or API key.", type: "error" });
    }
    setIsSyncing(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(formatRunName(name.trim()), main, playlist, label, playlistData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[4px]" onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl bg-black/85 border border-white/10 backdrop-blur-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Edit Run</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white"><X size={20} /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/50 block mb-1">Run Name</label>
            <input type="text" value={name} onChange={handleNameChange} onBlur={() => setName(toSentenceCase(name))} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-white" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setMain(!main)} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition ${main ? 'bg-yellow-500/80 text-black' : 'bg-white/10 text-white/60'}`}><Star size={14} /> {main ? 'Main Run' : 'Set as Main'}</button>
            <span className="text-xs text-white/40">Main run name is omitted from stream title</span>
          </div>
          <div>
            <label className="text-sm text-white/50 block mb-1">Status Label</label>
            <select value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-white">
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Abandoned">Abandoned</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-white/50 block mb-1">YouTube Playlist (for this run)</label>
            <div className="flex gap-2">
              <input type="text" value={playlist} onChange={e => setPlaylist(e.target.value)} placeholder="https://youtube.com/playlist?list=..." className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white" />
              <button onClick={handleSyncPlaylist} disabled={isSyncing} className={`bg-white/10 hover:bg-white/20 p-2 rounded-lg transition shrink-0 border border-white/10 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`} title="Sync Runtime Data">
                {isSyncing ? <Loader2 size={20} className="animate-spin text-white" /> : <RefreshCw size={20} className="text-red-400" />}
              </button>
            </div>
            
            <div className="mt-2 text-xs text-white/50 bg-white/5 p-2 rounded-lg border border-white/5">
               <p className="mb-1">Recommended Playlist Name:</p>
               <button 
                  onClick={handleCopyTitle}
                  className="text-left w-full bg-black/40 hover:bg-white/10 p-2 rounded transition flex justify-between items-center group shadow-inner"
               >
                  <span className="text-blue-400 font-medium group-hover:text-blue-300 truncate mr-2">{suggestedTitle}</span>
                  {copied ? <Check size={14} className="text-emerald-400 shrink-0" /> : <Copy size={14} className="text-white/40 group-hover:text-white/80 shrink-0" />}
               </button>
            </div>

            {syncStatus && <p className={`text-xs mt-2 ${syncStatus.type === 'error' ? 'text-red-400' : syncStatus.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}`}>{syncStatus.text}</p>}
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-white"><Save size={16} /> Save</button>
          <button onClick={onClose} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
};