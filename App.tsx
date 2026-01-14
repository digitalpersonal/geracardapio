import React, { useState } from 'react';
import { MenuForm } from './components/MenuForm';
import { ArtPreview } from './components/ArtPreview';
import { CreativeData, GeneratedContent, AppStatus, ImageRefinement } from './types';
import { generateMarmitaContent, regenerateCreativeImage } from './services/geminiService';
import { Palette } from 'lucide-react';

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
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao gerar a arte. Verifique sua chave de API e tente novamente.");
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
    } catch (err) {
      console.error("Refinement Error:", err);
      alert("Erro ao refinar a imagem. Tente novamente.");
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
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8 border border-red-200 text-center">
            {error}
            <button onClick={() => setStatus(AppStatus.IDLE)} className="block mx-auto mt-2 text-sm underline">Tentar Novamente</button>
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

      <footer className="text-center text-gray-500 text-sm mt-12 pb-4 leading-relaxed">
        &copy; {new Date().getFullYear()} geracardapio.<br />
        Desenvolvido por Multiplus - Sistemas Inteligentes<br />
        Silvio T. de Sá Filho
      </footer>
    </div>
  );
};

export default App;