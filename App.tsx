
import React, { useState } from 'react';
import { MenuForm } from './components/MenuForm';
import { ArtPreview } from './components/ArtPreview';
import { InstallPWA } from './components/InstallPWA';
import { CreativeData, GeneratedContent, AppStatus, ImageRefinement } from './types';
import { generateMarmitaContent, regenerateCreativeImage } from './services/geminiService';
import { Palette, MessageCircle, Heart } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [menuData, setMenuData] = useState<CreativeData | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refinement State (Internal loading state to avoid full app block)
  const [isRefining, setIsRefining] = useState(false);

  const handleGenerate = async (data: CreativeData) => {
    setStatus(AppStatus.GENERATING);
    setError(null);
    setMenuData(data);
    
    try {
      const result = await generateMarmitaContent(data);
      setGeneratedContent(result);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      // Exibe a mensagem real do erro para facilitar o diagnóstico
      const errorMessage = err?.message || "Ocorreu um erro desconhecido ao gerar a arte.";
      setError(`Erro na IA: ${errorMessage}`);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleRefineImage = async (refinement: ImageRefinement) => {
    if (!menuData || !generatedContent) return;

    setIsRefining(true);
    
    try {
      const newImageUrl = await regenerateCreativeImage(menuData, refinement);
      setGeneratedContent({
        ...generatedContent,
        imageUrl: newImageUrl
      });
    } catch (err: any) {
      console.error("Refinement Error:", err);
      alert(`Erro ao refinar imagem: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setMenuData(null);
    setGeneratedContent(null);
    setError(null);
    setIsRefining(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 font-sans text-gray-900 pb-12">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-brand-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 transition-transform duration-300 hover:scale-105 cursor-default select-none"
            title="geracardapio"
          >
            <div className="bg-brand-500 text-white p-2 rounded-lg shadow-sm">
              <Palette size={24} />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
              gera<span className="text-brand-500">cardapio</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        
        {status === AppStatus.ERROR && (
          <div className="bg-red-50 text-red-700 p-6 rounded-xl mb-8 border border-red-200 text-center shadow-sm">
            <h3 className="font-bold text-lg mb-2">Ops! Algo deu errado.</h3>
            <p className="mb-4 text-sm font-mono bg-white/50 p-2 rounded inline-block">{error}</p>
            <button 
              onClick={() => handleGenerate(menuData!)} 
              className="block mx-auto px-6 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold text-sm transition-colors"
            >
              Tentar Novamente
            </button>
            <button onClick={() => setStatus(AppStatus.IDLE)} className="block mx-auto mt-4 text-xs text-gray-500 underline">
              Voltar ao início
            </button>
          </div>
        )}

        {status === AppStatus.IDLE || status === AppStatus.GENERATING ? (
           <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="text-center mb-8 max-w-2xl">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Central de Criação Inteligente</h2>
                <p className="text-lg text-gray-600">
                  Gere posts profissionais para o seu **Restaurante**. Nossa IA cuida do design e do texto da sua marmita do dia para você.
                </p>
              </div>
              <MenuForm onSubmit={handleGenerate} status={status} />
           </div>
        ) : (
          status === AppStatus.SUCCESS && menuData && generatedContent && (
            <ArtPreview 
              data={menuData} 
              content={generatedContent} 
              onReset={handleReset}
              onRefineImage={handleRefineImage}
              isRefining={isRefining}
            />
          )
        )}
      </main>

      <footer className="mt-16 pb-12 px-4 border-t border-brand-100/50 bg-gradient-to-b from-transparent to-brand-50/50">
        <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-6">
          
          {/* Action Area */}
          <div className="flex flex-col items-center justify-center gap-3 w-full max-w-sm mx-auto">
            <InstallPWA />
            
            <a 
              href="https://wa.me/5535991048020?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20sobre%20o%20GeraCardapio!"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-4 rounded-xl shadow-lg hover:brightness-105 transition-all font-bold text-xs uppercase tracking-wide border border-[#20bd5a] w-full justify-center"
            >
              <MessageCircle size={18} /> Falar com Desenvolvedor
            </a>
          </div>

          <div className="pt-6">
            <p className="text-gray-400 text-xs font-medium flex items-center justify-center gap-1 mb-1">
              Feito com <Heart size={10} className="text-red-400 fill-red-400" /> para empreendedores
            </p>
            <p className="text-gray-500 text-sm font-semibold">
              &copy; {new Date().getFullYear()} geracardapio
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Desenvolvido por Multiplus - Sistemas Inteligentes<br />
              Silvio T. de Sá Filho
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default App;
