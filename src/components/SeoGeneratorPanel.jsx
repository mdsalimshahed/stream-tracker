// src/components/SeoGeneratorPanel.jsx
import React, { useState, useEffect } from 'react';
import { Copy, Sparkles, ExternalLink, AlertTriangle } from 'lucide-react';

export default function SeoGeneratorPanel({ game, gameId, year, nC, cycle, cycleName, streamData, onNotify }) {
  // --- SEO State ---
  const [streamSummary, setStreamSummary] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Current Playlist State (Auto-populates if one exists for this run)
  const [currentPlaylistInput, setCurrentPlaylistInput] = useState(cycle?.youtubePlaylist || '');

  // Keep it synced if the user switches cycles
  useEffect(() => {
    setCurrentPlaylistInput(cycle?.youtubePlaylist || '');
  }, [cycle]);

  // Persistent SEO Configuration States
  const [streamQuality, setStreamQuality] = useState(() => {
    return localStorage.getItem('seoStreamQuality') || '1440p 60fps';
  });
  const [promoText, setPromoText] = useState(() => {
    return localStorage.getItem('seoPromoText') || `MY FREE CREATOR TOOLS ⬇️\nManage your livestreams, thumbnails, and SEO easily: https://stream-tracker.mdsalimshahed.workers.dev/\nCreate video chapters & subtitles in seconds. 100% free, no sign-up needed: https://videocaptioncreator.pages.dev`;
  });
  const [pcSpecs, setPcSpecs] = useState(() => {
    return localStorage.getItem('seoPcSpecs') || `My Laptop Specs:\n• CPU: Intel Core i7-12650H\n• GPU: NVIDIA RTX 4070 Laptop GPU\n• RAM: 16 GB\n• SSD: 1 TB NVMe`;
  });

  // Persist SEO custom fields
  useEffect(() => { localStorage.setItem('seoStreamQuality', streamQuality); }, [streamQuality]);
  useEffect(() => { localStorage.setItem('seoPromoText', promoText); }, [promoText]);
  useEffect(() => { localStorage.setItem('seoPcSpecs', pcSpecs); }, [pcSpecs]);

  const handleCopy = (text, silent = false, msg = 'Copied!') => {
    navigator.clipboard.writeText(text);
    if (!silent) onNotify(msg, 'info');
  };

  // --- SEO Prompt Generation ---
  const generateAiPrompt = () => {
    if (!streamSummary.trim()) {
      onNotify('Please enter a brief summary first', 'error');
      return;
    }

    const dev = game.details?.developer || 'Unknown';
    const genres = game.details?.genres || 'Unknown';
    const tags = game.details?.tags || 'Unknown';
    
    // Format the current run type name
    const cycleDisplayName = cycle?.displayName || (cycleName === 'main' ? 'First Playthrough' : cycleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    
    // Read from the new input field instead of strictly the cycle data
    const currentPlaylist = currentPlaylistInput.trim() || '[INSERT PLAYLIST LINK HERE]';

    // Collect Playlists
    let ongoing = [];
    let completed = [];
    
    Object.entries(streamData).forEach(([gId, gData]) => {
      Object.entries(gData.cycles || {}).forEach(([cId, cData]) => {
        if (gId === gameId && cId === cycleName) return; // Skip current
        if (cData.youtubePlaylist) {
          const entry = `► ${gData.game_name} (${gData.release_year}) Playlist: ${cData.youtubePlaylist}`;
          if (cData.label === 'Completed') completed.push(entry);
          else ongoing.push(entry);
        }
      });
    });

    // Shuffle arrays
    const shuffle = (arr) => arr.sort(() => 0.5 - Math.random());
    ongoing = shuffle(ongoing);
    completed = shuffle(completed);

    // Pick 2 ongoing, 2 completed, fill to 5
    let selectedPlaylists = [];
    selectedPlaylists.push(...ongoing.slice(0, 2));
    selectedPlaylists.push(...completed.slice(0, 2));
    const needed = 5 - selectedPlaylists.length;
    const remaining = [...ongoing.slice(2), ...completed.slice(2)];
    selectedPlaylists.push(...remaining.slice(0, needed));

    const otherPlaylistsText = selectedPlaylists.length > 0
      ? selectedPlaylists.join('\n')
      : '[No other playlists found]';

    const promptText = `Act as an expert YouTube SEO specialist. I am a gaming YouTuber and I need a highly optimized YouTube livestream description, search keywords, and hashtags based on the format provided below.

Here is the brief summary of what happened in the stream:
"${streamSummary.trim()}"

YOUR TASK:
1. FACT-CHECK & CORRECT: The summary provided may contain typos, bad grammar, or misremembered character/quest names. Before writing anything, search the web to identify the exact, correct in-game quest names, locations, bosses, items, or NPCs. You MUST prioritize information gathering from reputed gaming sources like IGN, official guides, and wikis for this particular game, strictly avoiding or downranking social media content like Reddit.
2. WRITE THE HOOK: Write a highly descriptive hook for the video description based on these verified details. Use natural, human-sounding phrasing. Keep sentences short, to the point, and descriptive. Do not sound like a monotonous AI description, and avoid typical "AI slop" vocabulary. Do not be overly casual or humorous. STRICTLY AVOID using em dashes or hyphens.
3. GENERATE SEO KEYWORDS & HASHTAGS: Generate a massive block of highly relevant SEO search keywords (separated by |) and hashtags (#). Focus ONLY on the specific quests, bosses, the game name, and the stream quality (${streamQuality.trim() || '1440p 60fps'}) mentioned in the summary. STRICTLY AVOID hallucinating or including irrelevant quest names, NPCs, or locations that were not part of this specific session.
4. Fill out the exact template below, replacing the bracketed information with your generated content. Do NOT change the promo links, laptop specs, or playlist links.
5. Output the final description in Markdown format so it is easy to copy and paste. Do not include your search process or conversational filler in the final output.

=== REQUIRED TEMPLATE FORMAT ===
[Descriptive hook about the specific quests/bosses, following all writing rules]

Enjoying the ${game.game_name} adventure? Smash that LIKE button & SUBSCRIBE for more Gameplay!

► ${game.game_name} (${year}) Playlist: ${currentPlaylist}

Check out my other GAMEPLAY videos:
${otherPlaylistsText}

${promoText.trim()}

${pcSpecs.trim()}

[SEO Keywords separated by | ]
[Hashtags]
================================

=== RAW DATA FOR THIS STREAM ===
Game Name: ${game.game_name} (${year})
Run Type: ${cycleDisplayName}
Livestream Episode: #${nC}
Developer: ${dev}
Genres: ${genres}
Tags: ${tags}
Stream Quality: ${streamQuality.trim() || '1440p 60fps'}`;

    setAiPrompt(promptText);
    onNotify('Prompt generated successfully!', 'success');
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden custom-scrollbar animate-in fade-in duration-300">
      
      {/* Left Panel: Inputs */}
      {/* FIXED MOBILE SCROLLING: changed h-full to lg:h-full so the right panel stacks underneath on mobile */}
      <div className="w-full lg:w-7/12 lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col bg-neutral-900/50 p-4 sm:p-6 gap-4 lg:overflow-y-auto custom-scrollbar shrink-0">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1"><Sparkles size={18} className="text-amber-400"/> Context & Configuration</h3>
          <p className="text-sm text-white/50">Fill out these details to generate a highly engineered SEO prompt. Configuration inputs save automatically.</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">1. Stream Summary</label>
          <textarea
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-white transition-colors custom-scrollbar resize-none min-h-[100px]"
            placeholder="e.g., Defeating Talos the Guardian Gigantus before reaching Volcanic Island..."
            value={streamSummary}
            onChange={(e) => setStreamSummary(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">2. Current Run Playlist</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-white transition-colors"
              placeholder="e.g., https://youtube.com/playlist?list=..."
              value={currentPlaylistInput}
              onChange={(e) => setCurrentPlaylistInput(e.target.value)}
            />
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">3. Stream Quality</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-white transition-colors"
              placeholder="e.g., 1440p 60fps"
              value={streamQuality}
              onChange={(e) => setStreamQuality(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">4. Promo Links & Tools</label>
            <textarea
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-white transition-colors custom-scrollbar resize-none min-h-[160px]"
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
            />
          </div>
          
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">5. PC / Hardware Specs</label>
            <textarea
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-white transition-colors custom-scrollbar resize-none min-h-[160px]"
              value={pcSpecs}
              onChange={(e) => setPcSpecs(e.target.value)}
            />
          </div>
        </div>
        
        <button 
          onClick={generateAiPrompt}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 shrink-0"
        >
          <Sparkles size={18} /> Generate AI Prompt
        </button>
      </div>

      {/* Right Panel: Output & AI Linking */}
      {/* FIXED MOBILE SCROLLING: changed h-full to lg:h-full */}
      <div className="flex-1 flex flex-col bg-black p-4 sm:p-6 gap-4 min-w-[300px] lg:h-full lg:overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-1">Generated Prompt</h3>
            <p className="text-xs text-white/40">Copy this block and paste it into ChatGPT, Gemini, Claude, or DeepSeek.</p>
          </div>
          {aiPrompt && (
            <button 
              onClick={() => handleCopy(aiPrompt, false, 'Prompt Copied!')}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Copy size={14} /> Copy
            </button>
          )}
        </div>

        {/* Warning Banner */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-200/80 leading-relaxed">
            <strong>Important:</strong> Ensure you have <strong className="text-white">Web Search enabled</strong> in your chosen AI tool before pasting this prompt, so it can accurately fact-check names and locations.
          </p>
        </div>

        <div className="flex-1 min-h-[300px] relative rounded-xl border border-white/10 overflow-hidden bg-neutral-900/80">
          {!aiPrompt ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm p-8 text-center">
              Fill out the summary on the left and click "Generate" to build your master SEO prompt.
            </div>
          ) : (
            <textarea 
              readOnly
              value={aiPrompt}
              className="w-full h-full bg-transparent p-4 text-sm text-white/80 font-mono custom-scrollbar outline-none resize-none"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button onClick={() => window.open('https://chatgpt.com/', '_blank')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10a37f]/20 text-[#10a37f] border border-[#10a37f]/30 hover:bg-[#10a37f]/30 transition text-sm font-medium">
            <ExternalLink size={14} /> ChatGPT
          </button>
          <button onClick={() => window.open('https://gemini.google.com/', '_blank')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#8ab4f8]/20 text-[#8ab4f8] border border-[#8ab4f8]/30 hover:bg-[#8ab4f8]/30 transition text-sm font-medium">
            <ExternalLink size={14} /> Gemini
          </button>
          <button onClick={() => window.open('https://claude.ai/', '_blank')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#d97757]/20 text-[#d97757] border border-[#d97757]/30 hover:bg-[#d97757]/30 transition text-sm font-medium">
            <ExternalLink size={14} /> Claude
          </button>
          <button onClick={() => window.open('https://chat.deepseek.com/', '_blank')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#4db8ff]/20 text-[#4db8ff] border border-[#4db8ff]/30 hover:bg-[#4db8ff]/30 transition text-sm font-medium">
            <ExternalLink size={14} /> DeepSeek
          </button>
        </div>
      </div>

    </div>
  );
}