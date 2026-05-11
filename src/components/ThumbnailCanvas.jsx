// src/components/ThumbnailCanvas.jsx
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function ThumbnailCanvas({ bgImageUrl, gameName, cycleName, streamCount, config, customFont, canvasRef }) {
  const [isDrawing, setIsDrawing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!canvasRef.current || !bgImageUrl) return;

    const renderThumbnail = async () => {
      setIsDrawing(true);
      
      const activeFont = customFont || 'Inter';
      const fontFace = `"${activeFont}", sans-serif`;

      // 1. STRICT FONT LOADING: Force browser to fully load TTF/Web font into memory BEFORE drawing
      if (activeFont === 'Book Antiqua') {
        try {
          const localFont = new FontFace('Book Antiqua', 'url(/BKANT.TTF)');
          const loadedFont = await localFont.load();
          document.fonts.add(loadedFont);
        } catch (err) {
          console.warn('Failed to preload BKANT.TTF. Ensure it is in the public/ folder.', err);
        }
      } else {
        try {
          await document.fonts.load(`16px "${activeFont}"`);
        } catch (err) {}
      }
      
      await document.fonts.ready;
      if (!isMounted) return;

      // 2. IMAGE LOADING
      const loadImage = (src, crossOrigin) => new Promise((resolve, reject) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      let imgToDraw;
      try {
        imgToDraw = await loadImage(bgImageUrl, true);
      } catch (err) {
        try {
          imgToDraw = await loadImage(bgImageUrl, false);
        } catch (err2) {
          if (isMounted) setIsDrawing(false);
          return;
        }
      }

      if (!isMounted) return;

      // 3. BEGIN DRAWING
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const targetW = 1280, targetH = 720;
      
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, targetW, targetH);
      
      // --- Auto-Crop Black Bars Logic ---
      let cropX = 0, cropY = 0, cropW = imgToDraw.width, cropH = imgToDraw.height;
      
      try {
        const smSize = 64;
        const smCanvas = document.createElement('canvas');
        smCanvas.width = smSize;
        smCanvas.height = smSize;
        const smCtx = smCanvas.getContext('2d', { willReadFrequently: true });
        smCtx.drawImage(imgToDraw, 0, 0, smSize, smSize);
        
        const imgData = smCtx.getImageData(0, 0, smSize, smSize).data;
        const threshold = 18; 
        
        let topBound = 0;
        for (let y = 0; y < smSize; y++) {
          let isBlackRow = true;
          for (let x = 0; x < smSize; x++) {
            const i = (y * smSize + x) * 4;
            if (imgData[i] > threshold || imgData[i+1] > threshold || imgData[i+2] > threshold) { isBlackRow = false; break; }
          }
          if (!isBlackRow) { topBound = y; break; }
        }

        let bottomBound = smSize - 1;
        for (let y = smSize - 1; y >= 0; y--) {
          let isBlackRow = true;
          for (let x = 0; x < smSize; x++) {
            const i = (y * smSize + x) * 4;
            if (imgData[i] > threshold || imgData[i+1] > threshold || imgData[i+2] > threshold) { isBlackRow = false; break; }
          }
          if (!isBlackRow) { bottomBound = y; break; }
        }

        let leftBound = 0;
        for (let x = 0; x < smSize; x++) {
          let isBlackCol = true;
          for (let y = 0; y < smSize; y++) {
            const i = (y * smSize + x) * 4;
            if (imgData[i] > threshold || imgData[i+1] > threshold || imgData[i+2] > threshold) { isBlackCol = false; break; }
          }
          if (!isBlackCol) { leftBound = x; break; }
        }

        let rightBound = smSize - 1;
        for (let x = smSize - 1; x >= 0; x--) {
          let isBlackCol = true;
          for (let y = 0; y < smSize; y++) {
            const i = (y * smSize + x) * 4;
            if (imgData[i] > threshold || imgData[i+1] > threshold || imgData[i+2] > threshold) { isBlackCol = false; break; }
          }
          if (!isBlackCol) { rightBound = x; break; }
        }

        if (topBound > 1 || bottomBound < smSize - 2 || leftBound > 1 || rightBound < smSize - 2) {
          cropY = Math.floor((topBound / smSize) * imgToDraw.height);
          const bottomY = Math.ceil(((bottomBound + 1) / smSize) * imgToDraw.height);
          cropH = bottomY - cropY;
          cropX = Math.floor((leftBound / smSize) * imgToDraw.width);
          const rightX = Math.ceil(((rightBound + 1) / smSize) * imgToDraw.width);
          cropW = rightX - cropX;
        }
      } catch (e) {}

      // --- Manual Zoom Logic ---
      const scale = Math.max(targetW / cropW, targetH / cropH);
      const scaledW = cropW * scale;
      const scaledH = cropH * scale;
      const dx = (targetW - scaledW) / 2;
      const dy = (targetH - scaledH) / 2;

      const zoomRatio = (config.bgZoom || 100) / 100;
      const zoomedW = scaledW * zoomRatio;
      const zoomedH = scaledH * zoomRatio;
      const zoomedDx = dx - (zoomedW - scaledW) / 2;
      const zoomedDy = dy - (zoomedH - scaledH) / 2;

      ctx.drawImage(imgToDraw, cropX, cropY, cropW, cropH, zoomedDx, zoomedDy, zoomedW, zoomedH);

      // --- Text Rendering Methods ---
      const getScaledFont = (text, initialSize, maxWidth, weight, style, spacing) => {
        let size = initialSize;
        ctx.font = `${style} ${weight} ${size}px ${fontFace}`;
        ctx.letterSpacing = `${spacing}px`;
        while (size > 20 && ctx.measureText(text).width > maxWidth) { 
          size -= 5; 
          ctx.font = `${style} ${weight} ${size}px ${fontFace}`; 
        }
        return size;
      };

      const renderTextCleanly = (text, x, y, size, align, strokeColor, fillColor, strokeWidth, weight, style, spacing, shadow = null) => {
        const buffer = document.createElement('canvas');
        buffer.width = targetW; buffer.height = targetH;
        const bctx = buffer.getContext('2d');
        bctx.font = `${style} ${weight} ${size}px ${fontFace}`;
        bctx.letterSpacing = `${spacing}px`;
        bctx.textAlign = align;
        bctx.textBaseline = 'alphabetic';
        bctx.lineJoin = "round";
        if (shadow) { bctx.fillStyle = shadow.color; bctx.fillText(text, x + shadow.x, y + shadow.y); }
        bctx.lineWidth = strokeWidth;
        bctx.strokeStyle = strokeColor;
        bctx.strokeText(text, x, y);
        bctx.globalCompositeOperation = 'destination-out';
        bctx.fillText(text, x, y);
        bctx.globalCompositeOperation = 'source-over';
        bctx.fillStyle = fillColor;
        bctx.fillText(text, x, y);
        ctx.drawImage(buffer, 0, 0);
      };

      // --- Draw Texts ---
      const titleWeight = config.titleBold ? 'bold' : 'normal';
      const titleStyle = config.titleItalic ? 'italic' : 'normal';
      const streamWeight = config.streamBold ? 'bold' : 'normal';
      const streamStyle = config.streamItalic ? 'italic' : 'normal';
      const cycleWeight = config.cycleBold ? 'bold' : 'normal';
      const cycleStyle = config.cycleItalic ? 'italic' : 'normal';
      
      let parts = [gameName];
      if (config.splitTitle && gameName.includes(":")) { 
        const idx = gameName.indexOf(":"); 
        parts = [gameName.substring(0, idx+1).trim(), gameName.substring(idx+1).trim()]; 
      }
      
      const sizes = parts.map((part, i) => getScaledFont(
        part, 
        i === 0 ? config.titleSize : config.subtitleSize, 
        1150, 
        titleWeight, 
        titleStyle, 
        i === 0 ? (config.titleLetterSpacing || 0) : (config.subtitleLetterSpacing || 0)
      ));
      
      ctx.textBaseline = 'alphabetic';
      const heights = parts.map((part, i) => { 
        ctx.font = `${titleStyle} ${titleWeight} ${sizes[i]}px ${fontFace}`; 
        ctx.letterSpacing = `${i === 0 ? (config.titleLetterSpacing || 0) : (config.subtitleLetterSpacing || 0)}px`;
        const m = ctx.measureText(part); 
        return m.actualBoundingBoxAscent + m.actualBoundingBoxDescent; 
      });
      
      const pt = config.titleYOffset, cX = targetW / 2;
      let mL = 1; 
      try {
        const sL = Math.max(0, cX - 200), sT = Math.max(0, pt - 16), rW = 400, rH = 200;
        const d_ = ctx.getImageData(sL, sT, rW, rH).data;
        let lum = 0; for (let i = 0; i < d_.length; i += 4) lum += (0.299*d_[i] + 0.587*d_[i+1] + 0.114*d_[i+2]);
        mL = (lum / (d_.length / 4)) / 255;
      } catch (e) {}
      
      let isL = (mL >= 0.45);
      if (config.forceInvertTitle) isL = !isL;

      let cTY = pt;
      parts.forEach((p, i) => {
        const dY = cTY + heights[i], dX = config.titleAlign === 'left' ? 50 : config.titleAlign === 'right' ? targetW - 50 : cX;
        const sC = isL ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)", fC = isL ? "rgba(255,255,255,0.59)" : "rgba(0,0,0,0.59)";
        const spacing = i === 0 ? (config.titleLetterSpacing || 0) : (config.subtitleLetterSpacing || 0);
        renderTextCleanly(p, dX, dY, sizes[i], config.titleAlign, config.manualColors.title ? config.colors.titleStroke : sC, config.manualColors.title ? config.colors.titleFill : fC, config.strokeWidth, titleWeight, titleStyle, spacing);
        cTY += heights[i] + (i === 0 && parts.length === 2 ? config.titleSpacing : 0);
      });

      const sT_ = `Livestream #${streamCount}`, cT_ = cycleName === "main" ? "First Playthrough" : cycleName;
      let bX = config.bottomPaddingX; if (config.bottomAlign === 'center') bX = targetW/2; else if (config.bottomAlign === 'right') bX = targetW - config.bottomPaddingX;
      
      ctx.font = `${streamStyle} ${streamWeight} ${config.streamCountSize}px ${fontFace}`;
      ctx.letterSpacing = `${config.streamCountLetterSpacing || 0}px`;
      const sm = ctx.measureText(sT_), sA = sm.actualBoundingBoxAscent, sH_ = sA + sm.actualBoundingBoxDescent, sDY = targetH - sH_ - config.bottomPaddingY + sA;
      const sh = config.showBottomShadow ? { x: 5, y: 5, color: "rgba(0,0,0,0.7)" } : null;
      renderTextCleanly(sT_, bX, sDY, config.streamCountSize, config.bottomAlign, config.manualColors.streamCount ? config.colors.streamStroke : "rgba(0,0,0,0.78)", config.manualColors.streamCount ? config.colors.streamFill : "#FFF", 6, streamWeight, streamStyle, config.streamCountLetterSpacing || 0, sh);
      
      if (cT_) {
        ctx.font = `${cycleStyle} ${cycleWeight} ${config.cycleSize}px ${fontFace}`;
        ctx.letterSpacing = `${config.cycleLetterSpacing || 0}px`;
        const cm = ctx.measureText(cT_), cA = cm.actualBoundingBoxAscent, cDY = sDY - sA - config.bottomSpacing - cm.actualBoundingBoxDescent + cA;
        renderTextCleanly(cT_, bX, cDY, config.cycleSize, config.bottomAlign, config.manualColors.cycle ? config.colors.cycleStroke : "rgba(0,0,0,0.78)", config.manualColors.cycle ? config.colors.cycleFill : "#FFD700", 4, cycleWeight, cycleStyle, config.cycleLetterSpacing || 0, sh);
      }

      if (isMounted) setIsDrawing(false);
    };

    renderThumbnail();

    return () => { isMounted = false; };
  }, [bgImageUrl, gameName, cycleName, streamCount, config, customFont, canvasRef]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Strict 16:9 Aspect Ratio Container to lock Yellow Borders perfectly around the Canvas */}
      <div className="relative shadow-2xl flex items-center justify-center bg-black" style={{ aspectRatio: '16/9', maxHeight: '100%', maxWidth: '100%' }}>
        {isDrawing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Loader2 className="animate-spin text-blue-400 mb-3" size={32} />
            <span className="text-sm text-white/50">Rendering thumbnail...</span>
          </div>
        )}
        <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-cover block" />
        
        {/* Visual Corner Crop Guides (Pure Tailwind Gradients) */}
        <div className="corner-gradient-tl absolute top-0 left-0 w-8 sm:w-16 h-8 sm:h-16 pointer-events-none z-20" />
        <div className="corner-gradient-tr absolute top-0 right-0 w-8 sm:w-16 h-8 sm:h-16 pointer-events-none z-20" />
        <div className="corner-gradient-bl absolute bottom-0 left-0 w-8 sm:w-16 h-8 sm:h-16 pointer-events-none z-20" />
        <div className="corner-gradient-br absolute bottom-0 right-0 w-8 sm:w-16 h-8 sm:h-16 pointer-events-none z-20" />
      </div>
    </div>
  );
}