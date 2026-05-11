// src/components/modals/EditGameModal.jsx
import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

export const EditGameModal = ({ game, onClose, onSave }) => {
  const [name, setName] = useState(game.game_name || '');
  const [year, setYear] = useState(game.release_year || '');
  const [developer, setDeveloper] = useState(game.details?.developer || '');
  const [publisher, setPublisher] = useState(game.details?.publisher || '');
  const [genres, setGenres] = useState(game.details?.genres || '');
  const [tags, setTags] = useState(game.details?.tags || '');
  const [steamUrl, setSteamUrl] = useState(game.details?.steamUrl || '');
  const [steamIdInput, setSteamIdInput] = useState('');
  const [notOnSteam, setNotOnSteam] = useState(game.details?.notOnSteam || false);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(
      game.id, 
      name.trim(), 
      year.trim(), 
      developer.trim(), 
      publisher.trim(), 
      genres.trim(), 
      tags.trim(), 
      steamIdInput.trim(),
      steamUrl.trim(),
      notOnSteam
    );
    onClose();
  };

  const openSteamSearch = () => {
    const searchUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(name)}`;
    window.open(searchUrl, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl flex flex-col max-h-[90vh]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 shrink-0 border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white">Edit Game Data</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"><X size={20} /></button>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider block mb-1.5 ml-1">Game Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white transition-colors"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider block mb-1.5 ml-1">Release Year</label>
              <input
                type="text"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white transition-colors"
                placeholder="e.g., 2024"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider block mb-1.5 ml-1">Developer</label>
              <input
                type="text"
                value={developer}
                onChange={e => setDeveloper(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white transition-colors"
                placeholder="e.g., FromSoftware"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider block mb-1.5 ml-1">Publisher</label>
              <input
                type="text"
                value={publisher}
                onChange={e => setPublisher(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white transition-colors"
                placeholder="e.g., Bandai Namco"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider block mb-1.5 ml-1">Genres</label>
              <input
                type="text"
                value={genres}
                onChange={e => setGenres(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white transition-colors"
                placeholder="e.g., Action, RPG"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider block mb-1.5 ml-1">Tags</label>
              <textarea
                value={tags}
                rows={2}
                onChange={e => setTags(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white transition-colors custom-scrollbar"
                placeholder="e.g., Singleplayer, Dark Fantasy, Souls-like"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-white/50 uppercase tracking-wider block mb-1.5 ml-1">Steam URL</label>
              <input
                type="text"
                value={steamUrl}
                onChange={e => setSteamUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white transition-colors"
                placeholder="https://store.steampowered.com/app/..."
              />
            </div>
            
            <div className="sm:col-span-2 pt-4 mt-2 border-t border-white/10">
              <label className="flex items-center gap-2 mb-3 cursor-pointer w-fit">
                <input 
                  type="checkbox" 
                  checked={notOnSteam} 
                  onChange={e => setNotOnSteam(e.target.checked)} 
                  className="w-4 h-4 rounded bg-black/40 border border-white/10 accent-blue-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-white/80">Not on Steam (Use RAWG Only)</span>
              </label>
              
              {!notOnSteam && (
                <>
                  <label className="text-sm font-semibold text-white/50 uppercase tracking-wider block mb-1.5 ml-1">Steam Auto-Sync (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={steamIdInput}
                      onChange={e => setSteamIdInput(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 text-white transition-colors"
                      placeholder="Paste Steam Link or App ID to Auto Sync..."
                    />
                    <button
                      onClick={openSteamSearch}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap text-white shadow-lg transition-colors"
                    >
                      Find on Steam
                    </button>
                  </div>
                  <p className="text-xs text-blue-400 mt-2 ml-1">Note: Using this field will fetch fresh images and overwrite all manual fields above with Steam data.</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-colors"
          >
            <Save size={18} /> Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg text-white font-bold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};