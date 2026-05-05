import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const ThumbnailCanvas = ({ 
  bgImageUrl, 
  gameName, 
  cycleName, 
  streamCount,
  config,      
  customFont,
  canvasRef 
}) => {
  const [isDrawing, setIsDrawing] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !bgImageUrl) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const targetW = 1280, targetH = 720;
    
    const fontFace = customFont ? `"${customFont}", serif` : '"Book Antiqua", "Palatino Linotype", Palatino, serif';

    const getScaledFont = (text, initialSize, maxWidth) => {
      let size = initialSize;
      ctx.font = `900 ${size}px ${fontFace}`;
      while (size > 20 && ctx.measureText(text).width > maxWidth) { size -= 5; ctx.font = `900 ${size}px ${fontFace}`; }
      return size;
    };

    const renderTextCleanly = (text, x, y, size, align, strokeColor, fillColor, strokeWidth, shadow = null) => {
      const buffer = document.createElement('canvas');
      buffer.width = targetW; buffer.height = targetH;
      const bctx = buffer.getContext('2d');
      bctx.font = `900 ${size}px ${fontFace}`;
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

    const drawCanvas = (imgToDraw) => {
      ctx.clearRect(0, 0, targetW, targetH);
      const tr = targetW / targetH, ir = imgToDraw.width / imgToDraw.height;
      let sx, sy, sW, sH;
      if (ir > tr) { sH = imgToDraw.height; sW = sH * tr; sx = (imgToDraw.width - sW) / 2; sy = 0; }
      else { sW = imgToDraw.width; sH = sW / tr; sx = 0; sy = (imgToDraw.height - sH) / 2; }
      ctx.drawImage(imgToDraw, sx, sy, sW, sH, 0, 0, targetW, targetH);
      
      let parts = [gameName];
      if (config.splitTitle && gameName.includes(":")) { 
        const idx = gameName.indexOf(":"); 
        parts = [gameName.substring(0, idx+1).trim(), gameName.substring(idx+1).trim()]; 
      }
      const sizes = parts.map((part, i) => getScaledFont(part, i === 0 ? config.titleSize : config.subtitleSize, 1150));
      ctx.textBaseline = 'alphabetic';
      const heights = parts.map((part, i) => { 
        ctx.font = `900 ${sizes[i]}px ${fontFace}`; 
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
        renderTextCleanly(p, dX, dY, sizes[i], config.titleAlign, config.manualColors.title ? config.colors.titleStroke : sC, config.manualColors.title ? config.colors.titleFill : fC, config.strokeWidth);
        cTY += heights[i] + (i === 0 && parts.length === 2 ? config.titleSpacing : 0);
      });

      const sT_ = `Livestream #${streamCount}`, cT_ = cycleName === "main" ? "First Playthrough" : cycleName;
      let bX = config.bottomPaddingX; if (config.bottomAlign === 'center') bX = targetW/2; else if (config.bottomAlign === 'right') bX = targetW - config.bottomPaddingX;
      ctx.font = `900 ${config.streamCountSize}px ${fontFace}`;
      const sm = ctx.measureText(sT_), sA = sm.actualBoundingBoxAscent, sH_ = sA + sm.actualBoundingBoxDescent, sDY = targetH - sH_ - config.bottomPaddingY + sA;
      const sh = config.showBottomShadow ? { x: 5, y: 5, color: "rgba(0,0,0,0.7)" } : null;
      
      renderTextCleanly(sT_, bX, sDY, config.streamCountSize, config.bottomAlign, config.manualColors.streamCount ? config.colors.streamStroke : "rgba(0,0,0,0.78)", config.manualColors.streamCount ? config.colors.streamFill : "#FFF", 6, sh);
      if (cT_) {
        ctx.font = `900 ${config.cycleSize}px ${fontFace}`;
        const cm = ctx.measureText(cT_), cA = cm.actualBoundingBoxAscent, cDY = sDY - sA - config.bottomSpacing - cm.actualBoundingBoxDescent + cA;
        renderTextCleanly(cT_, bX, cDY, config.cycleSize, config.bottomAlign, config.manualColors.cycle ? config.colors.cycleStroke : "rgba(0,0,0,0.78)", config.manualColors.cycle ? config.colors.cycleFill : "#FFD700", 4, sh);
      }
      setIsDrawing(false);
    };

    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => drawCanvas(img);
    img.onerror = () => { const f_ = new Image(); f_.onload = () => drawCanvas(f_); f_.src = bgImageUrl; };
    img.src = bgImageUrl;
  }, [bgImageUrl, gameName, cycleName, streamCount, config, customFont, canvasRef]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black font-arial">
        {isDrawing && <div className="absolute inset-0 z-10 bg-slate-900/95 flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500 mb-4 h-12 w-12"/><span className="font-bold text-sm uppercase tracking-widest text-slate-500">Mastering...</span></div>}
        <canvas ref={canvasRef} width={1280} height={720} className="w-auto h-auto max-w-full max-h-full object-contain" />
    </div>
  );
};

export default ThumbnailCanvas;
