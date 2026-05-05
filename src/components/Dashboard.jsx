import React, { useState, useEffect } from 'react';
import { parseCustomTimestamp } from '../utils/helpers';

const Dashboard = ({ streamData, openGameProfile }) => {
  const [recentStreams, setRecentStreams] = useState([]);

  useEffect(() => {
    const recent = [];
    Object.entries(streamData).forEach(([appId, game]) => {
      Object.entries(game.cycles || {}).forEach(([cycleName, cycleData]) => {
        const timestamps = cycleData.timestamps || [];
        if (timestamps.length > 0) {
          recent.push({
            appId,
            gameName: game.game_name,
            releaseYear: game.release_year,
            cycleName,
            count: cycleData.stream_count,
            lastTimeStr: timestamps[timestamps.length - 1],
            lastTimeDate: parseCustomTimestamp(timestamps[timestamps.length - 1])
          });
        }
      });
    });
    recent.sort((a, b) => b.lastTimeDate - a.lastTimeDate);
    setRecentStreams(recent.slice(0, 15));
  }, [streamData]);

  return (
    <div className="max-w-7xl mx-auto mt-12 px-4 animate-in fade-in font-arial overflow-y-auto custom-scrollbar h-full pb-32">
      <div className="space-y-4">
        {recentStreams.map((stream, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-center gap-6 hover:border-slate-500 transition-all group shadow-xl">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono text-slate-500 mb-2 font-bold">{stream.lastTimeStr}</p>
              <h3 className="text-white font-bold text-2xl truncate">{stream.gameName} — <span className="text-purple-500">{stream.cycleName}</span></h3>
              <p className="text-sm font-bold text-slate-400 mt-2 tracking-wide">Livestream #{stream.count}</p>
            </div>
            <button onClick={() => openGameProfile(stream.appId)} className="bg-slate-800 hover:bg-white hover:text-black text-white px-10 py-4 text-xs font-bold transition-all border border-slate-700 shadow-lg">Resume</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
