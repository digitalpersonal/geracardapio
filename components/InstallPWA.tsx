
import React, { useState, useEffect } from 'react';
import { Download, Share, X, PlusSquare, Smartphone } from 'lucide-react';

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detecta se já está rodando como app (standalone)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detecta se é iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Captura o evento de instalação do Chrome/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Fluxo Automático (Android/Chrome)
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else {
      // Fluxo Manual (iOS ou Fallback para Desktop/Outros navegadores)
      setShowIOSInstructions(true);
    }
  };

  // Se já estiver instalado (rodando como app), não mostra o botão para não poluir a tela
  if (isStandalone) return null;

  return (
    <>
      <button 
        onClick={handleInstallClick}
        className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-lg hover:bg-black transition-all font-bold text-xs uppercase tracking-wide border border-gray-800 w-full justify-center"
      >
        <Download size={18} className="text-brand-500" />
        Instalar Aplicativo
      </button>

      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 relative shadow-2xl animate-slide-up">
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"
            >
              <X size={20} />
            </button>
            
            <div className="text-center space-y-5">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg shadow-brand-200">
                 <img src="https://cdn-icons-png.flaticon.com/512/7541/7541900.png" className="w-12 h-12 invert brightness-0" alt="Logo" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">Instalar geracardapio</h3>
                <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                  Adicione à sua tela de início para usar como um aplicativo nativo.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-4 border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="bg-white w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center font-bold text-brand-600 text-sm shrink-0 shadow-sm">1</div>
                  <span className="text-sm text-gray-600 pt-1">Toque no botão <strong>Compartilhar</strong> ou <strong>Menu</strong> do navegador.</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center font-bold text-brand-600 text-sm shrink-0 shadow-sm">2</div>
                  <span className="text-sm text-gray-600 pt-1">Procure e selecione a opção <strong>"Adicionar à Tela de Início"</strong> <PlusSquare size={14} className="inline mx-1" />.</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center font-bold text-brand-600 text-sm shrink-0 shadow-sm">3</div>
                  <span className="text-sm text-gray-600 pt-1">Confirme tocando em <strong>Adicionar</strong> ou <strong>Instalar</strong>.</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 font-medium pt-2 flex items-center justify-center gap-2">
                <Smartphone size={12} /> Disponível para iOS e Android
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
