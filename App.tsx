
import React, { useState } from 'react';
import { MenuForm } from './components/MenuForm';
import { ArtPreview } from './components/ArtPreview';
import { InstallPWA } from './components/InstallPWA';
import { CreativeData, GeneratedContent, AppStatus, ImageRefinement } from './types';
import { generateMarmitaContent, regenerateCreativeImage } from './services/geminiService';
import { Palette, MessageCircle, Heart, AlertCircle, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [menuData, setMenuData] = useState<CreativeData | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      console.error("Erro completo:", err);
      // Extrai mensagem limpa do erro
      let msg = err?.message || "Erro desconhecido.";
      if (msg.includes("403")) msg = "Chave de API inválida ou sem permissão para este modelo.";
      if (msg.includes("404")) msg = "Modelo de IA não encontrado na sua conta.";
      if (msg.includes("SAFETY")) msg = "A IA recusou gerar a imagem por motivos de segurança (conteúdo do prompt).";
      
      setError(msg);
      // IMPORTANTE: Voltamos para IDLE (ou mantemos o form) mas com estado de erro visível
      // Isso impede que o form suma
      setStatus(AppStatus.ERROR); 
    }
  };

  const handleRefineImage = async (refinement: ImageRefinement) => {
    if (!menuData || !generatedContent) return;
    setIsRefining(true);
    try {
      const newImageUrl = await regenerateCreativeImage(menuData, refinement);
      setGeneratedContent({ ...generatedContent, imageUrl: newImageUrl });
    } catch (err: any) {
      alert(`Não foi possível alterar a imagem: ${err.message}`);
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

  // Lógica de visualização: Se for SUCESSO, mostra o Preview. 
  // Caso contrário (IDLE, GENERATING, ERROR), mostra o FORMULÁRIO.
  const showForm = status !== AppStatus.SUCCESS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 font-sans text-gray-900 pb-12">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-brand-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-default select-none"
            onClick={handleReset}
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

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        
        {/* Banner de Erro Flutuante - Não substitui o form, apenas avisa */}
        {error && (
          <div className="max-w-xl mx-auto mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-md flex items-start justify-between animate-fade-in">
             <div className="flex items-start gap-3">
               <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
               <div>
                 <h3 className="font-bold text-red-800 text-sm">Falha na Geração</h3>
                 <p className="text-red-700 text-xs mt-1">{error}</p>
               </div>
             </div>
             <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
               <XCircle size={20} />
             </button>
          </div>
        )}

        {showForm ? (
           <div className="flex flex-col items-center justify-center">
              {status !== AppStatus.GENERATING && (
                <div className="text-center mb-8 max-w-2xl">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Crie artes de cardápio em segundos</h2>
                  <p className="text-base text-gray-600 px-4">
                    Preencha os dados da marmita e deixe a IA criar o design e a legenda para você.
                  </p>
                </div>
              )}
              {/* Passamos o status para o form controlar o loading do botão */}
              <MenuForm onSubmit={handleGenerate} status={status} />
           </div>
        ) : (
          generatedContent && menuData && (
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

      {/* Footer apenas aparece se não estiver no modo sucesso (para não poluir o preview) */}
      {showForm && (
        <footer className="mt-16 pb-32 px-4 border-t border-brand-100/50 bg-gradient-to-b from-transparent to-brand-50/50">
          <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-6">
            <div className="flex flex-col items-center justify-center gap-3 w-full max-w-sm mx-auto">
              <InstallPWA />
              <a 
                href="https://wa.me/5535991048020?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20GeraCardapio!"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors font-semibold text-xs uppercase tracking-wide justify-center mt-4"
              >
                <MessageCircle size={16} /> Suporte / Falar com Desenvolvedor
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
