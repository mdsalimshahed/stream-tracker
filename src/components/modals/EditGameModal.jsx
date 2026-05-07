import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

export const EditGameModal = ({ game, onClose, onSave }) => {
  const [name, setName] = useState(game.game_name);
  const [year, setYear] = useState(game.release_year);
  const [rawgId, setRawgId] = useState('');
  const [label, setLabel] = useState(game.label || 'Ongoing');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave(game.id, name.trim(), year.trim(), rawgId.trim(), label);
    onClose();
  };

  const openRawgSearch = () => {
    const searchUrl = `https://rawg.io/search?query=${encodeURIComponent(name)}`;
    window.open(searchUrl, '_blank');
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
          <h3 className="text-xl font-bold text-white">Edit Game</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/50 block mb-1">Game Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-white/50 block mb-1">Release Year</label>
            <input
              type="text"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-white"
              placeholder="e.g., 2024"
            />
          </div>
          <div>
            <label className="text-sm text-white/50 block mb-1">Game Label</label>
            <select
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed ✓</option>
              <option value="Abandoned">Abandoned ✗</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-white/50 block mb-1">RAWG ID (optional – to refresh metadata)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rawgId}
                onChange={e => setRawgId(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-white"
                placeholder="e.g., 3498"
              />
              <button
                onClick={openRawgSearch}
                className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-white"
              >
                Search on RAWG
              </button>
            </div>
            <p className="text-xs text-white/30 mt-1">After pasting the ID/URL, click Save to refresh images & metadata.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-white"
          >
            <Save size={16} /> Save Changes
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