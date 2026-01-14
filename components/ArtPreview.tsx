import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CreativeData, GeneratedContent, ImageRefinement, PriceOption } from '../types';
import { 
  Download, Copy, RefreshCw, Edit3, Move, Save, Check, Wand2, 
  Share2, Trash2, Smartphone, Square, ZoomIn, ZoomOut, Maximize 
} from 'lucide-react';

interface ArtPreviewProps {
  data: CreativeData;
  content: GeneratedContent;
  onReset: () => void;
  onRefineImage?: (refinement: ImageRefinement) => void;
  isRefining?: boolean;
}

export const ArtPreview: React.FC<ArtPreviewProps> = ({ 
  data, 
  content, 
  onReset, 
  onRefineImage,
  isRefining = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [showUpdateFeedback, setShowUpdateFeedback] = useState(false);
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  
  // Estado para Zoom e Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [editValues, setEditValues] = useState({
    mainDish: data.mainDish,
    proteins: data.proteins,
    discountBadge: data.discountBadge || '',
    ctaText: data.ctaText || 'PEÇA AGORA',
    caption: content.caption,
    logoY: 0,
    logoOpacity: 100,
    logoBorder: false
  });

  // Carregar preferências salvas no localStorage ao montar o componente
  useEffect(() => {
    const savedPrefs = localStorage.getItem(`gc_prefs_${data.brandName.toLowerCase().replace(/\s/g, '_')}`);
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setEditValues(prev => ({
          ...prev,
          logoY: parsed.logoY ?? prev.logoY,
          logoOpacity: parsed.logoOpacity ?? prev.logoOpacity,
          logoBorder: parsed.logoBorder ?? prev.logoBorder,
          ctaText: parsed.ctaText ?? prev.ctaText
        }));
      } catch (e) {
        console.error("Erro ao carregar preferências:", e);
      }
    }
  }, [data.brandName]);

  const handleEditChange = (field: string, value: any) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  // Salvar edições no localStorage
  const handleSaveEdits = () => {
    const prefsToSave = {
      logoY: editValues.logoY,
      logoOpacity: editValues.logoOpacity,
      logoBorder: editValues.logoBorder,
      ctaText: editValues.ctaText
    };
    localStorage.setItem(
      `gc_prefs_${data.brandName.toLowerCase().replace(/\s/g, '_')}`, 
      JSON.stringify(prefsToSave)
    );
    setShowSaveFeedback(true);
    setTimeout(() => setShowSaveFeedback(false), 2000);
    triggerUpdateFeedback();
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  const processImageBackground = (img: HTMLImageElement): string => {
    if (!data.removeLogoBg) return img.src;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return img.src;

    tCtx.drawImage(img, 0, 0);
    const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (r > 235 && g > 235 && b > 235) {
        pixels[i + 3] = 0;
      }
    }

    tCtx.putImageData(imageData, 0, 0);
    return tempCanvas.toDataURL();
  };

  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    await document.fonts.ready;
    try {
      const bgImg = await loadImage(content.imageUrl);
      let logoImg: HTMLImageElement | null = null;
      
      if (data.logo) {
        const processedLogoSrc = processImageBackground(await loadImage(data.logo));
        logoImg = await loadImage(processedLogoSrc);
      }

      const W = 1080; const H = 1920;
      canvas.width = W; canvas.height = H;
      
      const scale = Math.max(W / bgImg.width, H / bgImg.height);
      const bgX = (W / 2) - (bgImg.width / 2) * scale;
      const bgY = (H / 2) - (bgImg.height / 2) * scale;
      ctx.drawImage(bgImg, bgX, bgY, bgImg.width * scale, bgImg.height * scale);
      
      const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H * 0.45, W, H * 0.55);

      if (logoImg) {
        ctx.save();
        ctx.globalAlpha = editValues.logoOpacity / 100;
        const lW = 420; const lH = logoImg.height * (lW / logoImg.width);
        const lX = (W - lW) / 2;
        const lY = 120 + editValues.logoY;

        if (editValues.logoBorder) {
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 4;
          const padding = 30;
          if ((ctx as any).roundRect) {
            ctx.beginPath();
            (ctx as any).roundRect(lX - padding, lY - padding, lW + padding * 2, lH + padding * 2, 40);
            ctx.stroke();
          } else {
            ctx.strokeRect(lX - padding, lY - padding, lW + padding * 2, lH + padding * 2);
          }
        }

        ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 30;
        ctx.drawImage(logoImg, lX, lY, lW, lH);
        ctx.restore();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      
      ctx.font = 'bold 115px Oswald';
      ctx.fillText(editValues.mainDish.toUpperCase(), 75, H - 460);
      
      ctx.font = '500 55px Montserrat';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(editValues.proteins, 75, H - 380);

      if (data.priceOptions.length > 0) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 135px Oswald';
        ctx.fillText(data.priceOptions[0].value, W - 75, H - 460);
        ctx.font = '500 35px Montserrat';
        ctx.fillText(data.priceOptions[0].label.toUpperCase(), W - 75, H - 420);
      }

      const btnW = 560; const btnH = 120; const btnX = (W - btnW) / 2; const btnY = H - 240;
      ctx.fillStyle = '#f97316';
      ctx.shadowBlur = 20;
      if ((ctx as any).roundRect) (ctx as any).roundRect(btnX, btnY, btnW, btnH, 60);
      else ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'center';
      ctx.font = 'bold 50px Montserrat';
      ctx.fillText(editValues.ctaText.toUpperCase(), W / 2, btnY + 78);

      if (editValues.discountBadge) {
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(W - 160, 160, 110, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 45px Oswald';
        ctx.fillText(editValues.discountBadge.toUpperCase(), W - 160, 175);
        ctx.restore();
      }

      if (data.whatsapp) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, H - 90, W, 90);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 38px Montserrat';
        ctx.fillText(`PEDIDOS: ${data.whatsapp}`, W / 2, H - 35);
      }

      setDownloadUrl(canvas.toDataURL('image/png', 1.0));
    } catch (error) { console.error("Erro ao desenhar canvas:", error); }
  }, [content.imageUrl, data, editValues]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  // Handlers para Zoom e Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const adjustZoom = (delta: number) => {
    setZoom(prev => {
      const next = Math.min(Math.max(prev + delta, 1), 5);
      if (next === 1) setPan({ x: 0, y: 0 }); 
      return next;
    });
  };

  const resetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.download = `marmita-premium-${Date.now()}.png`;
    link.href = downloadUrl;
    link.click();
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(editValues.caption);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  const handleShare = async () => {
    if (!downloadUrl) return;

    try {
      // Converte dataURL para Blob e depois para File para permitir compartilhamento da imagem
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const file = new File([blob], `marmita-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Cardápio ${data.brandName}`,
          text: editValues.caption
        });
      } else if (navigator.share) {
        // Fallback apenas para texto se o navegador não suportar arquivos no share
        await navigator.share({
          title: `Cardápio ${data.brandName}`,
          text: editValues.caption
        });
      } else {
        alert("O seu navegador não suporta compartilhamento direto. Experimente baixar a arte e copiar a legenda!");
      }
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.error("Erro ao compartilhar:", error);
      }
    }
  };

  const triggerUpdateFeedback = () => {
    setShowUpdateFeedback(true);
    setTimeout(() => setShowUpdateFeedback(false), 1500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start pb-20 px-4">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Coluna da Esquerda: Preview interativo */}
      <div className="w-full lg:w-[420px] shrink-0 mx-auto space-y-6">
        <div className="flex items-center justify-between px-2">
           <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Arte Gerada</span>
           
           <div className="flex items-center gap-1 bg-white shadow-sm border rounded-lg p-1">
              <button onClick={() => adjustZoom(0.5)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Aumentar Zoom"><ZoomIn size={16}/></button>
              <button onClick={() => adjustZoom(-0.5)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Diminuir Zoom"><ZoomOut size={16}/></button>
              <button onClick={resetZoomPan} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Resetar Visualização"><Maximize size={16}/></button>
           </div>
        </div>
        
        <div className="bg-white p-2 rounded-[3.5rem] shadow-2xl border border-gray-100 ring-8 ring-gray-50/50">
           <div 
             className={`relative rounded-[3rem] overflow-hidden aspect-[9/16] bg-black ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
           >
             {downloadUrl ? (
               <img 
                 src={downloadUrl} 
                 style={{ 
                   transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                   transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                 }}
                 className={`w-full h-full object-cover select-none transition-opacity duration-500 ${isRefining ? 'opacity-40' : 'opacity-100'}`} 
                 alt="Arte Final" 
               />
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4">
                 <RefreshCw className="animate-spin" size={32} />
                 <p className="text-xs font-bold uppercase">Renderizando...</p>
               </div>
             )}
             
             {zoom > 1 && !isDragging && (
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold py-1 px-3 rounded-full pointer-events-none">
                 ARRASTE PARA MOVER
               </div>
             )}

             {isRefining && (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-black/50 p-6 rounded-full">
                    <RefreshCw className="text-white animate-spin" size={48} />
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* BONDE DE SALVAR E COMPARTILHAR */}
        <div className="space-y-3 px-2">
          <button 
            onClick={handleDownload}
            disabled={!downloadUrl}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white py-6 rounded-2xl font-black shadow-[0_10px_30px_rgba(249,115,22,0.3)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-xl disabled:opacity-50"
          >
            <Download size={28} /> BAIXAR ARTE EM HD
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleShare}
              disabled={!downloadUrl}
              className="py-4 rounded-2xl font-bold border-2 bg-brand-50 border-brand-200 text-brand-600 hover:bg-brand-100 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 size={20} /> COMPARTILHAR
            </button>
            <button 
              onClick={handleCopyCaption}
              className={`py-4 rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${showCopyFeedback ? 'bg-green-50 border-green-200 text-green-600 shadow-inner' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'}`}
            >
              {showCopyFeedback ? <><Check size={20} /> COPIADA!</> : <><Copy size={20} /> LEGENDA</>}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-gray-400 text-[10px] font-medium">
          <Smartphone size={12} /> Ideal para Instagram Stories e WhatsApp
        </div>
      </div>

      <div className="flex-1 w-full space-y-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Edit3 size={16} className="text-brand-500" /> Legenda do Post
          </h4>
          <textarea 
            value={editValues.caption} 
            onChange={e => handleEditChange('caption', e.target.value)}
            className="w-full p-4 bg-gray-50 border-0 rounded-2xl text-sm text-gray-700 min-h-[160px] focus:ring-2 focus:ring-brand-500 outline-none resize-none leading-relaxed"
            placeholder="A IA gerou essa legenda para você..."
          />
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center justify-between border-b border-gray-50 pb-5">
            <div>
              <h4 className="font-bold text-gray-800">Ajustes da Arte</h4>
              <p className="text-gray-400 text-[10px]">Altere textos e posições em tempo real</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSaveEdits} 
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all transform active:scale-95 flex items-center gap-2 ${showSaveFeedback ? 'bg-green-500 text-white' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
              >
                {showSaveFeedback ? <><Check size={14}/> SALVO!</> : <><Save size={14}/> SALVAR EDIÇÕES</>}
              </button>
              <button 
                onClick={triggerUpdateFeedback} 
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all transform active:scale-95 ${showUpdateFeedback ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {showUpdateFeedback ? 'ATUALIZADO!' : 'ATUALIZAR VISUAL'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Prato Principal</label>
              <input type="text" value={editValues.mainDish} onChange={e => handleEditChange('mainDish', e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl text-sm font-semibold text-gray-800" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Selo de Oferta (Topo)</label>
              <input type="text" value={editValues.discountBadge} onChange={e => handleEditChange('discountBadge', e.target.value)} className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl text-sm font-semibold text-gray-800" />
            </div>
          </div>

          <div className="pt-2 space-y-6">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2"><Move size={14}/> Posicionar Logomarca</span>
               
               <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-[9px] font-bold text-gray-400 uppercase group-hover:text-brand-500 transition-colors">Borda Sutil</span>
                  <div className="relative inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={editValues.logoBorder} 
                      onChange={(e) => handleEditChange('logoBorder', e.target.checked)} 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                  </div>
               </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Altura (Y)</label>
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 rounded">{editValues.logoY}px</span>
                </div>
                <input type="range" min="-100" max="800" value={editValues.logoY} onChange={e => handleEditChange('logoY', Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500" />
              </div>
              
              <div className="bg-gray-50 p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-gray-500 font-bold uppercase">Visibilidade</label>
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 rounded">{editValues.logoOpacity}%</span>
                </div>
                <input type="range" min="0" max="100" value={editValues.logoOpacity} onChange={e => handleEditChange('logoOpacity', Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500" />
              </div>
            </div>

            {data.removeLogoBg && (
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3 text-green-700 text-xs font-bold">
                 <div className="bg-green-500 p-1 rounded-full text-white"><Check size={12}/></div>
                 Transparência Mágica aplicada na Logomarca.
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wand2 size={80} />
           </div>
           
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-brand-500 p-2.5 rounded-xl"><Wand2 size={24} /></div>
               <h4 className="font-bold text-xl">Não curtiu a foto do prato?</h4>
             </div>
             <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-md">Nossa IA pode gerar uma fotografia gastronômica totalmente diferente para o mesmo cardápio.</p>
             
             <button 
               onClick={() => onRefineImage?.({negativePrompt: "low quality, blurry, messy", seed: Math.floor(Math.random()*9999999)})} 
               disabled={isRefining}
               className="w-full bg-white text-gray-900 py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 text-lg shadow-xl"
             >
               <RefreshCw className={isRefining ? 'animate-spin' : ''} size={22}/> SOLICITAR NOVA FOTO DO PRATO
             </button>
             <p className="text-center text-[9px] text-gray-500 mt-4 font-bold uppercase tracking-widest">Atenção: Isso mudará apenas a imagem de fundo.</p>
           </div>
        </div>

        <div className="pt-6">
          <button 
            onClick={onReset} 
            className="w-full py-4 text-gray-400 font-bold text-sm hover:text-brand-500 transition-all flex items-center justify-center gap-2"
          >
            ← VOLTAR E CRIAR NOVO CARDÁPIO
          </button>
        </div>
      </div>
    </div>
  );
};