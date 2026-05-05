import React, { useState, useEffect } from 'react';
import { ArrowRight, X, Gamepad2, Plus, Check, Clock, Trash2 } from 'lucide-react';
import { formatRunName } from '../utils/helpers';

const GameProfileModal = ({ gameId, gameData, onClose, onStartWorkspace, onDeleteCycle, onDeleteTimestamp, onNotify }) => {
  const [selectedCycle, setSelectedCycle] = useState('main');
  const [newCycleName, setNewCycleName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedLogIndex, setSelectedLogIndex] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (!gameData) return null;
  const cycles = gameData.cycles || { main: { stream_count: 0, timestamps: [] } };
  const cycleKeys = Object.keys(cycles);
  
  useEffect(() => { 
    if (!cycleKeys.includes(selectedCycle) && cycleKeys.length > 0) {
      setSelectedCycle(cycleKeys[0]);
      setSelectedLogIndex(null);
    }
  }, [cycleKeys, selectedCycle]);

  const currentCycleData = cycles[selectedCycle] || { stream_count: 0, timestamps: [] };

  const handleNext = () => {
    const finalCycleName = isCreatingNew && newCycleName ? formatRunName(newCycleName.trim()) : selectedCycle;
    onStartWorkspace(gameId, finalCycleName, selectedLogIndex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-950/95 backdrop-blur-sm animate-in fade-in font-arial overflow-hidden" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-[0_0_100px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="px-12 py-8 border-b border-slate-800 bg-slate-900 shrink-0 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold text-white tracking-tighter">{gameData.game_name}</h2>
            <div className="flex gap-6 mt-2">
               <p className="text-xs font-bold text-slate-500">{gameData.release_year}</p>
               <p className="text-xs font-bold text-slate-500 uppercase">RAWG {gameId}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={handleNext} 
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-12 py-4 text-sm flex items-center gap-4 transition-all active:scale-95 shadow-2xl"
            >
              Next <ArrowRight size={22}/>
            </button>
            <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-red-600 text-slate-300 transition-all rounded-full shadow-lg"><X size={24} /></button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden p-12 grid grid-cols-1 md:grid-cols-2 gap-16 bg-slate-900/50">
            
            {/* LEFT: Independent Scrollable Playthroughs */}
            <div className="flex flex-col h-full overflow-hidden">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8 shrink-0 flex items-center gap-3"><Gamepad2 size={20}/> Select Run</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-3">
                {cycleKeys.map(cycle => (
                  <div key={cycle} onClick={() => { setSelectedCycle(cycle); setIsCreatingNew(false); }} className={`p-6 border transition-all flex justify-between items-center group ${selectedCycle === cycle && !isCreatingNew ? 'border-blue-600 bg-blue-600/10 scale-[1.02]' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                    <div>
                      <h4 className="font-bold text-white text-lg tracking-tight">{cycle === 'main' ? 'First Playthrough' : cycle}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-2">{cycles[cycle].stream_count} Streams</p>
                    </div>
                    <div className="flex items-center gap-4">
                       {cycle !== 'main' && <button onClick={(e) => { e.stopPropagation(); onDeleteCycle(gameId, cycle); }} className="p-2 text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={20}/></button>}
                       {selectedCycle === cycle && !isCreatingNew && <Check className="text-blue-500" size={28} strokeWidth={5}/>}
                    </div>
                  </div>
                ))}
                <div onClick={() => setIsCreatingNew(true)} className={`p-6 border transition-all ${isCreatingNew ? 'border-purple-600 bg-purple-600/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                  <div className="flex items-center gap-3 text-slate-600 font-bold text-xs uppercase mb-4"><Plus size={18}/> Create New</div>
                  {isCreatingNew && (
                    <input 
                      type="text" 
                      placeholder="Enter run name..." 
                      value={newCycleName} 
                      onChange={(e) => setNewCycleName(formatRunName(e.target.value))} 
                      className="w-full bg-slate-900 border-b-2 border-purple-600 p-4 text-white text-lg font-bold outline-none placeholder:text-slate-800" 
                      autoFocus 
                      onClick={e => e.stopPropagation()} 
                    />
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Independent Scrollable Timeline */}
            <div className="flex flex-col h-full overflow-hidden border-l border-slate-800 pl-16">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8 shrink-0 flex items-center gap-3"><Clock size={20}/> Logs</h3>
              <div className="flex-1 bg-slate-950 border border-slate-800 overflow-y-auto custom-scrollbar p-4 shadow-inner">
                {currentCycleData.timestamps?.length > 0 ? (
                  <div className="space-y-3">
                    {[...currentCycleData.timestamps].reverse().map((ts, i) => {
                      const realIndex = currentCycleData.timestamps.length - 1 - i;
                      const active = selectedLogIndex === realIndex;
                      return (
                        <div 
                          key={i} 
                          onClick={() => setSelectedLogIndex(active ? null : realIndex)}
                          className={`px-6 py-5 cursor-pointer border transition-all flex items-center justify-between group shadow-xl ${active ? 'bg-emerald-600/20 border-emerald-500' : 'bg-slate-900 border-transparent hover:border-slate-700'}`}
                        >
                          <div className="flex flex-col">
                             <span className="text-white text-2xl font-bold tracking-tighter">Livestream #{realIndex + 1}</span>
                             <span className="text-xs font-bold text-slate-500 font-mono mt-1">{ts}</span>
                          </div>
                          <div className="flex items-center gap-4">
                             <button onClick={(e) => { e.stopPropagation(); onDeleteTimestamp(gameId, selectedCycle, realIndex, ts); }} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"><Trash2 size={20}/></button>
                             {active && <Check className="text-emerald-500" size={24} strokeWidth={5}/>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <div className="h-full flex items-center justify-center text-slate-800 text-sm font-bold uppercase tracking-widest">No History</div>}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GameProfileModal;