// src/components/stats/styles.js

export const STYLES = `
  @keyframes fillLine {
    0% { width: 0%; opacity: 1; }
    95% { width: 100%; opacity: 1; }
    100% { width: 100%; opacity: 0; }
  }

  .stats-root {
    --c-bg:      #080a0f;
    --c-surface: #0d1117;
    --c-border:  rgba(255,255,255,0.07);
    --c-accent:  #e8c87a;
    --c-accent2: #6eb5ff;
    --c-text:    #f0ece4;
    --c-muted:   rgba(240,236,228,0.7);
    --c-green:   #3ddc84;
    --c-orange:  #f5a623;
    --c-red:     #ff5c5c;
    color: var(--c-text);
  }
  .stats-root * { box-sizing: border-box; margin: 0; padding: 0; }

  /* --- MAIN SCROLL CONTAINER --- */
  .stats-scroll {
    position: relative; 
    z-index: 10; 
    height: 100%; 
    width: 100%; 
    overflow-y: auto; 
    display: flex; 
    flex-direction: column; 
    padding: 24px; 
    gap: 24px;
  }
  
  @media (min-width: 1024px) {
    .stats-scroll { overflow: hidden; }
  }


  /* =========================================================
     NEW METHOD: STRICT CSS GRID LAYOUT
     ========================================================= */

  /* TOP ROW */
  .stats-top-row {
    display: flex; 
    flex-direction: column; 
    gap: 24px; 
    flex-shrink: 0; 
  }
  
  @media (min-width: 1024px) {
    .stats-top-row { 
      /* Switch to Grid: Unbreakable equal-height columns */
      display: grid;
      grid-template-columns: calc(var(--flex-left) * 1%) calc(var(--flex-right) * 1%);
      grid-template-rows: 1fr;
      gap: 0; 
      flex: var(--flex-top) 1 0%; 
      min-height: 0; 
    }
  }

  /* LEFT COLUMN (CELL 1) */
  .stats-left-col { 
    display: flex; 
    flex-direction: column; 
    height: auto;
    width: 100%;
    z-index: 2;
  }
  @media (min-width: 1024px) {
    .stats-left-col { height: 100%; min-height: 0; }
  }

  /* PROGRESS DIVIDER */
  .stats-progress-track {
    background: var(--c-border);
    position: relative;
    z-index: 20;
    width: 100%;
    height: 2px;
    min-height: 2px;
    flex-shrink: 0;
  }
  .stats-progress-fill {
    position: absolute;
    top: 0; left: 0; height: 100%; width: 0%;
    background: linear-gradient(to right, rgba(232, 200, 122, 0.2), var(--c-accent));
    animation: fillLine var(--cycle-speed, 5s) linear infinite;
  }

  /* RIGHT COLUMN (CELL 2) */
  .card-wrapper-right {
    position: relative;
    height: auto;
    width: 100%;
    min-height: 300px; /* Mobile fallback */
    z-index: 1;
  }
  @media (min-width: 1024px) {
    .card-wrapper-right { height: 100%; margin-left: -1px; min-height: 0; }
  }

  /* LEFT CARDS WRAPPERS */
  .card-wrapper-left {
    flex: 1; /* Divides the left column exactly 50/50 */
    position: relative;
    min-height: 160px; /* Mobile fallback */
  }
  @media (min-width: 1024px) {
    .card-wrapper-left { min-height: 0; }
  }


  /* =========================================================
     ABSOLUTE POSITIONING FOR CARDS (Stops content from breaking bounds)
     ========================================================= */

  /* The 3D container */
  .flipper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* The actual front/back faces */
  .flipper-face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    overflow: hidden;
  }

  .flip-back {
    transform: rotateY(180deg);
  }

  /* CARD STYLES */
  .stat-card, .stats-right-col {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6); 
    backdrop-filter: blur(8px); 
    padding: 24px; 
    display: flex; 
    flex-direction: column; 
    justify-content: center; 
    border: 1px solid var(--c-border); 
    border-radius: 0;
    transition: background 0.25s; 
  }
  
  .stats-right-col {
    background: rgba(13,17,23,0.35);
  }

  /* Hover borders */
  .stat-card:hover { background: rgba(20,26,36,0.8); }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(to right, var(--c-accent), transparent); opacity: 0; transition: opacity 0.25s;
    z-index: 10;
  }
  .stat-card:hover::before { opacity: 1; }

  /* CONTAINER QUERIES IMPLEMENTED HERE */
  .slide-container {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 6%; /* Percentage padding helps buffer tight corners */
    word-wrap: break-word;
    overflow-wrap: break-word;
    
    /* Dynamically resize text using container minimum dimensions */
    container-type: inline-size;
    --base-font: clamp(8px, 4cqi, 16px);
    --unit-1: var(--base-font);
    --unit-085: calc(var(--base-font) * 0.85);
    --unit-08: calc(var(--base-font) * 0.8);
    --unit-055: calc(var(--base-font) * 0.55);
    --unit-035: calc(var(--base-font) * 0.35);
    --unit-025: calc(var(--base-font) * 0.25);
  }

  /* =========================================================
     TYPOGRAPHY & CONTENT
     ========================================================= */

  .stat-number { 
    font-weight: 600; 
    line-height: 1.1; 
    letter-spacing: -0.02em; 
    color: var(--c-text); 
    transition: color 0.3s ease; 
    text-shadow: 0 4px 16px rgba(0,0,0,0.8); 
  }
  .stat-card:hover .stat-number { color: var(--c-accent); }
  .stats-right-col:hover .latest-title { color: var(--c-accent) !important; }

  /* DYNAMIC SIZING INJECTED */
  .top-number { font-size: calc(var(--sz-main) * var(--unit-1, 1rem)); }
  .stat-label { font-size: calc(var(--sz-main-label) * var(--unit-1, 1rem)); letter-spacing: 0.12em; text-transform: uppercase; color: var(--c-muted); margin-top: 12px; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
  
  .latest-title { font-size: calc(var(--sz-title) * var(--unit-1, 1rem)); font-weight: 600; margin-bottom: 8px; transition: color 0.3s; line-height: 1.1; }
  .latest-sub-3 { font-size: calc(var(--sz-sub) * var(--unit-1, 1rem)); color: var(--c-accent2); margin-top: 4px; line-height: 1.3; }
  .latest-sub-1, .latest-sub-2 { font-size: calc(var(--sz-sub) * var(--unit-08, 0.8rem)); color: var(--c-muted); margin-top: 6px; }
  .latest-sub-time { font-weight: bold; color: var(--c-text); font-size: 1.25em; }

  .latest-bg { position: absolute; inset: 0; z-index: 0; }
  .latest-content { 
    position: absolute; inset: 0; z-index: 1; padding: 24px; 
    background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); 
    display: flex; flex-direction: column; justify-content: flex-end; 
  }


  /* =========================================================
     BOTTOM CATEGORIES ROW
     ========================================================= */

  .cat-row { display: flex; flex-direction: column; gap: 24px; flex-shrink: 0; }
  
  @media (min-width: 1024px) {
    .cat-row { flex-direction: row; flex: var(--flex-bottom) 1 0%; min-height: 0; flex-shrink: 1; }
  }
  
  .cat-card { flex: 1; position: relative; overflow: hidden; border: 1px solid var(--c-border); border-radius: 0; min-height: 200px; display: flex; flex-direction: column; cursor: default; transition: all 0.3s ease; z-index: 1; }
  
  @media (min-width: 1024px) {
    .cat-card { min-height: 0; }
  }

  .cat-card:hover { transform: scale(1.02); box-shadow: 0 16px 48px rgba(0,0,0,0.8); z-index: 10; }
  
  .cat-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%); }
  .cat-content { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; pointer-events: none;}
  
  .cat-count { font-weight: 600; line-height: 1; letter-spacing: -0.02em; color: #fff; text-shadow: 0 4px 16px rgba(0,0,0,0.8); font-size: calc(var(--sz-main) * 0.8rem); }
  .cat-name { letter-spacing: 0.2em; text-transform: uppercase; margin-top: 8px; text-shadow: 0 2px 8px rgba(0,0,0,0.8); font-size: calc(var(--sz-label) * 1rem); }
  
  .cat-ongoing .cat-name   { color: var(--c-green); }
  .cat-completed .cat-name { color: var(--c-orange); }
  .cat-abandoned .cat-name { color: var(--c-red); }
  
  .game-name-overlay { 
    position: absolute; top: 20px; left: 20px; right: 20px; z-index: 3; font-weight: 600; color: white; pointer-events: none; 
    text-shadow: 0 4px 12px rgba(0,0,0,1), 0 2px 6px rgba(0,0,0,0.8); transition: color 0.3s ease;
    font-size: calc(var(--sz-label) * 1.1rem); line-height: 1.2;
  }
  .cat-card:hover .game-name-overlay { color: var(--c-accent); }

  /* Animations */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up  { animation: fadeUp 0.6s ease both; }
  .delay-1  { animation-delay: 0.1s; }
  .delay-2  { animation-delay: 0.2s; }

  /* =========================================================
     DEBUG SLIDES OVERRIDES & RECHARTS FIXES
     ========================================================= */

  /* Center only in Debug mode */
  .debug-slides .slide-container {
    align-items: center;
    text-align: center;
  }
  
  .debug-slides .stat-number, 
  .debug-slides .slide-container .flex {
    justify-content: center;
  }

  /* Force graphs unfocusable globally */
  .recharts-wrapper, 
  .recharts-wrapper *, 
  .recharts-surface, 
  .recharts-responsive-container, 
  svg.recharts-surface { 
    outline: none !important; 
  }
`;