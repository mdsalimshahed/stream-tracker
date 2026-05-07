import React, { useState } from 'react';
import { X, Save, Star } from 'lucide-react';
import { formatRunName } from '../../utils/helpers';

export const EditRunModal = ({ runName, isMain, youtubePlaylist, onSave, onClose }) => {
  const [name, setName] = useState(runName);
  const [main, setMain] = useState(isMain);
  const [playlist, setPlaylist] = useState(youtubePlaylist || '');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(formatRunName(name.trim()), main, playlist);
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
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/50 block mb-1">Run Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          <div className="flex items-center gap-3">
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
            <label className="text-sm text-white/50 block mb-1">YouTube Playlist (for this run)</label>
            <input
              type="text"
              value={playlist}
              onChange={e => setPlaylist(e.target.value)}
              placeholder="https://youtube.com/playlist?list=..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
            />
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