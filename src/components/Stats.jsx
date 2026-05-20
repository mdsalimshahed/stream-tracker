// src/components/Stats.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getLowResUrl } from '../utils/helpers';
import { useCountUp } from './stats/hooks';
import { CategoryCard } from './stats/CategoryCard';
import { STYLES } from './stats/styles';
import { Loader2 } from 'lucide-react';

import { getCard1Slide } from './stats/slides/Card1Slides';
import { getCard2Slide } from './stats/slides/Card2Slides';
import { getCard3Slide } from './stats/slides/Card3Slides';

const FlipperCard = ({ globalFlipCycle, getSlideContent, slideData, className, delay = 0, slideCount }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [localFlipCycle, setLocalFlipCycle] = useState(0);
  const [frontFaceSlide, setFrontFaceSlide] = useState(0);
  const [backFaceSlide, setBackFaceSlide] = useState(1);

  const prevGlobal = useRef(globalFlipCycle);

  useEffect(() => {
    let t;
    if (globalFlipCycle !== prevGlobal.current) {
      prevGlobal.current = globalFlipCycle;
      if (!isHovered) {
        t = setTimeout(() => {
          setLocalFlipCycle(prev => prev + 1);
        }, delay);
      }
    }
    return () => clearTimeout(t);
  }, [globalFlipCycle, isHovered, delay]);

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    if (localFlipCycle % 2 !== 0) {
      setFrontFaceSlide((localFlipCycle + 1) % slideCount);
    } else {
      if (localFlipCycle > 0) {
        setBackFaceSlide((localFlipCycle + 1) % slideCount);
      }
    }
  };

  const flipDegree = localFlipCycle * 180;

  return (
    <div
      className="flipper"
      style={{ transform: `rotateY(${flipDegree}deg)` }}
      onTransitionEnd={handleTransitionEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`${className} flipper-face flip-front`}>
        {getSlideContent(frontFaceSlide, slideData)}
      </div>
      <div className={`${className} flipper-face flip-back`}>
        {getSlideContent(backFaceSlide, slideData)}
      </div>
    </div>
  );
};

export default function Stats({ systemFonts, layoutPrefs, cachedStats }) {
  const { card1Data, card2Data, card3Data, games, isReady } = cachedStats;

  const [latestBgIndex, setLatestBgIndex] = useState(0);
  const [flipCycle, setFlipCycle] = useState(0);

  const handleAnimationIteration = () => {
    setFlipCycle(prev => prev + 1);
  };

  const totalStreamsCount = useCountUp(card1Data?.totalStreams || 0);
  const totalGamesCount = useCountUp(card2Data?.totalGames || 0);

  const latestGameImages = card3Data?.mostRecentGame?.thumbnail_urls || [];

  // DYNAMIC TEXT FIT LOGIC
  // Measures each slide panel independently. If the text overflows the height of the container,
  // it shrinks the font size just enough to make it fit securely inside.
  useEffect(() => {
    const checkFit = () => {
      const slides = document.querySelectorAll('.slide-container');
      const updates = [];
      
      // Step 1: Reset the scale to measure the text's natural height
      slides.forEach(slide => {
        slide.style.setProperty('--fit-scale', '1');
      });

      // Step 2: Measure text bounds vs container bounds
      slides.forEach(slide => {
        const clientH = slide.clientHeight;
        const scrollH = slide.scrollHeight;
        
        // If the content is taller than the container, we calculate the shrink ratio
        if (scrollH > clientH && clientH > 0) {
          const scale = clientH / scrollH;
          updates.push({ slide, scale });
        }
      });

      // Step 3: Apply the shrink multiplier (with a 5% safety margin) to ONLY the overflowing slides
      updates.forEach(({ slide, scale }) => {
        slide.style.setProperty('--fit-scale', Math.max(0.3, scale * 0.95).toFixed(3));
      });
    };

    checkFit();
    window.addEventListener('resize', checkFit);
    
    // We run it on an interval to catch any newly flipped slides that were off-screen
    const interval = setInterval(checkFit, 500);

    return () => {
      window.removeEventListener('resize', checkFit);
      clearInterval(interval);
    };
  }, [cachedStats]);

  useEffect(() => {
    if (latestGameImages.length < 2) return;
    const initialDelay = Math.random() * 2000;
    const cycleInterval = 3500 + Math.random() * 1000;
    let interval;
    const timeout = setTimeout(() => {
      setLatestBgIndex(prev => (prev + 1) % latestGameImages.length);
      interval = setInterval(() => {
        setLatestBgIndex(prev => (prev + 1) % latestGameImages.length);
      }, cycleInterval);
    }, initialDelay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [latestGameImages]);

  if (!isReady || !card1Data) {
    return <div className="flex items-center justify-center h-full text-white/50"><Loader2 className="animate-spin mr-2"/> Processing visual data...</div>;
  }

  const heroThumb = latestGameImages[0] || '';
  const rawLatestBgImage = latestGameImages[latestBgIndex] || heroThumb;
  const latestBgImage = getLowResUrl(rawLatestBgImage, layoutPrefs?.highResImages);

  const slideData1 = { ...card1Data, totalStreamsCount };
  const slideData2 = { ...card2Data, totalGamesCount };
  const slideData3 = { ...card3Data, latestBgImage };

  return (
    <div
      className="stats-root"
      style={{
        position: 'relative', height: '100%', width: '100%', overflow: 'hidden',
        '--sz-main':       systemFonts?.statsMainCount  ?? 4.5,
        '--sz-main-label': systemFonts?.statsMainLabel  ?? 1.1,
        '--sz-title':      systemFonts?.statsTitle       ?? 2.2,
        '--sz-sub':        systemFonts?.statsSub         ?? 1.1,
        '--sz-label':      systemFonts?.statsLabel       ?? 1.1,
        '--flex-top':    (layoutPrefs?.statsRowSplitRatio ?? 0.6)  * 100,
        '--flex-bottom': (1 - (layoutPrefs?.statsRowSplitRatio ?? 0.6))  * 100,
        '--flex-left':   (layoutPrefs?.statsSplitRatio   ?? 0.35) * 100,
        '--flex-right':  (1 - (layoutPrefs?.statsSplitRatio ?? 0.35)) * 100,
        '--cycle-speed': `${layoutPrefs?.bgCycleInterval ?? 5}s`,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="stats-scroll custom-scrollbar">
        <div className="stats-top-row fade-up delay-1 shadow-2xl">

          <div className="stats-left-col">
            <div className="card-wrapper-left">
              <FlipperCard globalFlipCycle={flipCycle} getSlideContent={getCard1Slide} slideData={slideData1} className="stat-card" delay={0} slideCount={6} />
            </div>
            <div className="stats-progress-track">
              <div className="stats-progress-fill" onAnimationIteration={handleAnimationIteration} />
            </div>
            <div className="card-wrapper-left">
              <FlipperCard globalFlipCycle={flipCycle} getSlideContent={getCard2Slide} slideData={slideData2} className="stat-card" delay={200} slideCount={6} />
            </div>
          </div>

          <div className="card-wrapper-right group">
            <div className="stats-right-col" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              {getCard3Slide(0, slideData3)}
            </div>
          </div>

        </div>

        <div className="cat-row fade-up delay-2">
          <CategoryCard title="Ongoing"   games={games} cssClass="cat-ongoing"   highResImages={layoutPrefs?.highResImages} />
          <CategoryCard title="Completed" games={games} cssClass="cat-completed" highResImages={layoutPrefs?.highResImages} />
          <CategoryCard title="Abandoned" games={games} cssClass="cat-abandoned" highResImages={layoutPrefs?.highResImages} />
        </div>
      </div>
    </div>
  );
}