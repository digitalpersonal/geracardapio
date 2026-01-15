
import React, { useState, useRef, useEffect } from 'react';
import { CreativeData, AppStatus, PriceOption } from '../types';
import { 
  ChefHat, Beef, DollarSign, Store, ImagePlus, X, 
  Megaphone, Camera,
  Trash2, Bike, Phone, IceCream, Coffee,
  Tag, MousePointer2, PlusCircle, Utensils,
  Lock, Wand2, RefreshCw
} from 'lucide-react';

interface MenuFormProps {
  onSubmit: (data: CreativeData) => void;
  status: AppStatus;
}

type ListFieldType = 'priceOptions' | 'dessertOptions' | 'drinkOptions' | 'additionalSideDishes';

export const MenuForm: React.FC<MenuFormProps> = ({ onSubmit, status }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [loadingText, setLoadingText] = useState('Gerando Arte...');
  
  const [formData, setFormData] = useState<CreativeData>({
    type: 'restaurant',
    brandName: '',
    logo: undefined,
    customImage: undefined,
    artStyle: 'Realista',
    logoX: 0,
    logoY: 0,
    logoDisplayMode: 'default',
    discountBadge: '',
    ctaText: 'PEÇA AGORA',
    mainDish: '',
    proteins: '',
    priceOptions: [{ label: 'Individual', value: '' }],
    additionalSideDishes: [],
    deliveryPrice: '',
    whatsapp: '',
    dessertOptions: [], 
    drinkOptions: [],   
    removeLogoBg: false,
    removeCustomImageBg: false
  });

  const loadingMessages = [
    "Aquecendo o forno...", 
    "Selecionando ingredientes...", 
    "Empratando a arte...", 
    "Finalizando o tempero..."
  ];

  useEffect(() => {
    if (status === AppStatus.GENERATING) {
      let i = 0;
      setLoadingText(loadingMessages[0]);
      const interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[i]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [status]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'customImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (field: 'logo' | 'customImage') => {
    setFormData(prev => ({ ...prev, [field]: undefined }));
    if (field === 'logo' && logoInputRef.current) logoInputRef.current.value = '';
    if (field === 'customImage' && imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleOptionChange = (optionsField: ListFieldType, index: number, field: keyof PriceOption, value: string) => {
    setFormData(prev => {
      const newOptions = [...(prev[optionsField] || [])];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return { ...prev, [optionsField]: newOptions };
    });
  };

  const addOption = (optionsField: ListFieldType) => {
    setFormData(prev => ({
      ...prev,
      [optionsField]: [...(prev[optionsField] || []), { label: '', value: '' }]
    }));
  };

  const removeOption = (optionsField: ListFieldType, index: number) => {
    setFormData(prev => ({
      ...prev,
      [optionsField]: (prev[optionsField] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === AppStatus.GENERATING) return;
    onSubmit(formData);
  };

  const renderDynamicList = (
    field: ListFieldType,
    title: string,
    icon: React.ReactNode,
    placeholderLabel: string,
    placeholderValue: string,
    minItems = 0
  ) => (
    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-4 animate-fade-in">
      <label className="block text-xs font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase">
        {icon} {title}
      </label>
      {(formData[field] || []).map((option, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input 
            type="text" 
            value={option.label} 
            onChange={(e) => handleOptionChange(field, index, 'label', e.target.value)} 
            placeholder={placeholderLabel} 
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-300 outline-none transition" 
          />
          <input 
            type="text" 
            value={option.value} 
            onChange={(e) => handleOptionChange(field, index, 'value', e.target.value)} 
            placeholder={placeholderValue} 
            className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm text-center focus:border-brand-300 outline-none transition" 
          />
          <button 
            type="button" 
            onClick={() => removeOption(field, index)} 
            disabled={minItems > 0 && (formData[field]?.length || 0) <= minItems}
            className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
          >
            <Trash2 size={16}/>
          </button>
        </div>
      ))}
      <button 
        type="button" 
        onClick={() => addOption(field)} 
        className="text-xs text-brand-600 font-bold flex items-center gap-1.5 mt-2 hover:text-brand-700 transition"
      >
        <PlusCircle size={14}/> Adicionar Item
      </button>
    </div>
  );

  const isGenerating = status === AppStatus.GENERATING;
  
  // Validação simplificada: Campos obrigatórios preenchidos?
  const isFormValid = formData.brandName.trim() !== '' && 
                      formData.mainDish.trim() !== '' && 
                      formData.proteins.trim() !== '';

  return (
    <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 w-full max-w-xl mx-auto border border-gray-100 relative">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Estúdio de Criação</h2>
        <p className="text-gray-500 text-sm mt-1">Preencha os dados abaixo para ativar o botão.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-32">
        
        {/* Identidade */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Store size={16} className="text-brand-500" /> Identidade do Restaurante <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="brandName"
            required
            value={formData.brandName}
            onChange={handleChange}
            placeholder="Nome da Marca"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none transition"
          />
          <div className="grid grid-cols-2 gap-3">
             <div className="relative">
                <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="hidden" />
                <button type="button" onClick={() => logoInputRef.current?.click()} className={`w-full h-12 border border-dashed rounded-lg flex items-center justify-center gap-2 text-sm transition ${formData.logo ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                  <ImagePlus size={16} /> {formData.logo ? 'Logo OK' : 'Sua Logo'}
                </button>
                {formData.logo && (
                  <div className="absolute top-14 left-0 w-full flex items-center gap-1">
                    <label className="flex items-center gap-1 text-[10px] text-gray-600 cursor-pointer bg-gray-100 px-2 py-1 rounded flex-1 justify-center">
                      <input type="checkbox" name="removeLogoBg" checked={formData.removeLogoBg} onChange={handleCheckboxChange} className="rounded text-brand-500" /> 🪄 Transp.
                    </label>
                    <button type="button" onClick={() => removeFile('logo')} className="bg-red-100 text-red-500 rounded p-1"><X size={12} /></button>
                  </div>
                )}
             </div>
             <div className="relative">
                <input ref={imageInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'customImage')} className="hidden" />
                <button type="button" onClick={() => imageInputRef.current?.click()} className={`w-full h-12 border border-dashed rounded-lg flex items-center justify-center gap-2 text-sm transition ${formData.customImage ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                  <Camera size={16} /> {formData.customImage ? 'Foto OK' : 'Foto Prato'}
                </button>
             </div>
          </div>
        </div>

        {/* Gatilhos de Venda */}
        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
           <label className="block text-sm font-bold text-brand-900 mb-3 flex items-center gap-2 uppercase tracking-tight">
            <Megaphone size={16} className="text-brand-500" /> Gatilhos de Venda
          </label>
          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1">
                  <Tag size={12} /> Selo de Promoção
                </label>
                <input
                  type="text"
                  name="discountBadge"
                  value={formData.discountBadge}
                  onChange={handleChange}
                  placeholder="Ex: 15% OFF"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none text-xs"
                />
             </div>
             <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1">
                  <MousePointer2 size={12} /> Texto do Botão
                </label>
                <input
                  type="text"
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleChange}
                  placeholder="Ex: PEÇA AGORA"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none text-xs"
                />
             </div>
          </div>
        </div>

        {/* Detalhes do Cardápio */}
        <div className="space-y-5 border-t border-gray-100 pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <ChefHat size={16} className="text-brand-500" /> Prato Principal do Dia <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="mainDish"
              required
              value={formData.mainDish}
              onChange={handleChange}
              placeholder="Ex: Parmegiana de Mignon com Fritas"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Beef size={16} className="text-brand-500" /> Itens da Marmita <span className="text-red-500">*</span>
            </label>
            <textarea
              name="proteins"
              required
              value={formData.proteins}
              onChange={handleChange}
              placeholder="Ex: Arroz branco, feijão, fritas e salada."
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="flex-1">
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Bike size={14}/> Entrega</label>
                <input type="text" name="deliveryPrice" value={formData.deliveryPrice} onChange={handleChange} placeholder="R$ 5" className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm" />
             </div>
             <div className="flex-1">
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone size={14}/> Whats</label>
                <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="99999-9999" className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm" />
             </div>
          </div>

          {/* Listas Dinâmicas */}
          <div className="space-y-1">
            {renderDynamicList('priceOptions', 'Tabela de Preços', <DollarSign size={14}/>, 'Tamanho', 'Preço', 1)}
            
            <div className="pt-2">
               <h3 className="text-sm font-bold text-gray-800 mb-3 border-l-4 border-brand-500 pl-2">Complementos do Cardápio</h3>
               {renderDynamicList('additionalSideDishes', 'Opcionais / Extras', <Utensils size={14}/>, 'Item (Ex: Ovo Frito)', '+ R$')}
               {renderDynamicList('drinkOptions', 'Bebidas', <Coffee size={14}/>, 'Bebida', 'R$')}
               {renderDynamicList('dessertOptions', 'Sobremesas', <IceCream size={14}/>, 'Doce', 'R$')}
            </div>
          </div>
        </div>

        {/* Botão Flutuante/Fixo */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-[100] shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <div className="max-w-xl mx-auto">
                <button
                type="submit"
                disabled={!isFormValid || isGenerating}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                    ${!isFormValid || isGenerating
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed transform-none shadow-none' 
                        : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:brightness-110 active:scale-95 hover:shadow-brand-500/30'
                    }
                `}
                >
                {isGenerating ? (
                    <>
                        <RefreshCw className="animate-spin" size={24}/>
                        {loadingText}
                    </>
                ) : !isFormValid ? (
                    <>
                        <Lock size={20} />
                        Preencha para Gerar
                    </>
                ) : (
                    <>
                        <Wand2 size={24} />
                        GERAR ARTE
                    </>
                )}
                </button>
                {!isFormValid && (
                    <p className="text-[10px] text-center text-gray-400 mt-2 font-medium">
                        Preencha: Marca, Prato e Itens da Marmita
                    </p>
                )}
            </div>
        </div>
      </form>
    </div>
  );
};
