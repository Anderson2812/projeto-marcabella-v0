'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  CURATED_SERVICE_IMAGES, 
  CuratedServiceImage, 
  findBestImageForService 
} from '@/lib/service-images';
import { 
  Image as ImageIcon, 
  Search, 
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  X, 
  Check,
  FolderOpen,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ServiceImagePickerProps {
  currentImageUrl?: string;
  currentImages?: string[];
  onImageChange?: (url: string) => void;
  onImagesChange?: (images: string[]) => void;
  serviceName?: string;
  serviceCategory?: string;
}

export default function ServiceImagePicker({
  currentImageUrl,
  currentImages = [],
  onImageChange,
  onImagesChange,
  serviceName,
  serviceCategory
}: ServiceImagePickerProps) {
  // Constrói lista unificada de fotos atuais
  const imageList: string[] = React.useMemo(() => {
    if (currentImages && currentImages.length > 0) {
      return currentImages;
    }
    if (currentImageUrl) {
      return [currentImageUrl];
    }
    return [];
  }, [currentImages, currentImageUrl]);

  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [isOpenGallery, setIsOpenGallery] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Notifica componentes pais
  const updateImageList = (newList: string[]) => {
    if (onImagesChange) {
      onImagesChange(newList);
    }
    if (onImageChange) {
      onImageChange(newList[0] || '');
    }
    if (activeCarouselIndex >= newList.length) {
      setActiveCarouselIndex(Math.max(0, newList.length - 1));
    }
  };

  const handleAddImage = (url: string) => {
    if (!url) return;
    if (imageList.includes(url)) return;
    updateImageList([...imageList, url]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = imageList.filter((_, idx) => idx !== indexToRemove);
    updateImageList(updated);
  };

  const handleClearAllImages = () => {
    updateImageList([]);
  };

  // Categorias disponíveis
  const categories = [
    { id: 'todos', label: 'Todas as Fotos' },
    { id: 'unhas', label: 'Unhas & Gel' },
    { id: 'cabelo', label: 'Cabelo & Mechas' },
    { id: 'barbearia', label: 'Barba & Corte Masc.' },
    { id: 'sobrancelhas', label: 'Sobrancelhas' },
    { id: 'cilios', label: 'Cílios / Lash' },
    { id: 'estetica', label: 'Estética & Skincare' },
    { id: 'massagem', label: 'Massagens' },
    { id: 'maquiagem', label: 'Maquiagem' }
  ];

  // Filtra galeria
  const filteredImages = CURATED_SERVICE_IMAGES.filter(img => {
    const matchesCategory = selectedCategory === 'todos' || img.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesQuery = img.title.toLowerCase().includes(query) ||
      img.category.toLowerCase().includes(query) ||
      img.keywords.some(k => k.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) return; // 5MB max

      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          handleAddImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    e.target.value = '';
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrlInput.trim()) {
      handleAddImage(customUrlInput.trim());
      setCustomUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleSuggestImage = () => {
    if (!serviceName) {
      alert('Digite o nome do serviço primeiro para sugerirmos a foto ideal.');
      return;
    }
    const suggested = findBestImageForService(serviceName, serviceCategory);
    handleAddImage(suggested);
  };

  return (
    <div className="space-y-3 p-4 bg-[#FDFBF7] dark:bg-zinc-800/60 rounded-2xl border border-[#E9E2D7] dark:border-zinc-700">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase text-[#2D2D2A] dark:text-zinc-200 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#8C4E46]" />
          <span>Fotos do Procedimento ({imageList.length} {imageList.length === 1 ? 'foto' : 'fotos'})</span>
        </label>
        
        <div className="flex items-center gap-2">
          {serviceName && (
            <button
              type="button"
              onClick={handleSuggestImage}
              className="text-2xs font-bold text-[#8C4E46] dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              title="Sugere uma foto baseada no nome do serviço"
            >
              <Sparkles className="w-3 h-3" />
              <span>Sugerir Foto</span>
            </button>
          )}

          {imageList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllImages}
              className="text-2xs font-medium text-stone-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
              title="Remover todas as fotos"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpar Fotos</span>
            </button>
          )}
        </div>
      </div>

      {/* Carrossel e Miniaturas */}
      {imageList.length > 0 ? (
        <div className="space-y-2.5">
          {/* Visualizador Principal do Carrossel */}
          <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-stone-900 border border-[#E9E2D7] dark:border-zinc-700 shadow-inner group">
            <Image
              src={imageList[activeCarouselIndex] || imageList[0]}
              alt={`Foto ${activeCarouselIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover transition-transform duration-300"
              referrerPolicy="no-referrer"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

            {/* Contador / Badge de Posição */}
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-white text-2xs font-bold flex items-center gap-1">
              <span>{activeCarouselIndex + 1} de {imageList.length}</span>
              {activeCarouselIndex === 0 && (
                <span className="text-amber-300 font-normal">• Capa Principal</span>
              )}
            </div>

            {/* Botão de Excluir Foto Atual */}
            <button
              type="button"
              onClick={() => handleRemoveImage(activeCarouselIndex)}
              className="absolute top-2.5 right-2.5 w-7 h-7 bg-red-600/90 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
              title="Excluir esta foto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Controles de Navegação Anterior / Próximo se houver mais de 1 foto */}
            {imageList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveCarouselIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-white text-stone-900 dark:text-zinc-100 flex items-center justify-center shadow-md transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                  title="Foto anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCarouselIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-white text-stone-900 dark:text-zinc-100 flex items-center justify-center shadow-md transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                  title="Próxima foto"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Faixa de Miniaturas Clicáveis */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {imageList.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 cursor-pointer transition-all ${
                  idx === activeCarouselIndex
                    ? 'border-[#8C4E46] ring-2 ring-[#8C4E46]/30 scale-105'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                onClick={() => setActiveCarouselIndex(idx)}
              >
                <Image
                  src={url}
                  alt={`Miniatura ${idx + 1}`}
                  fill
                  sizes="60px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(idx);
                  }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center cursor-pointer"
                  title="Remover"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Estado Vazio - Nenhuma foto */
        <div className="p-4 border-2 border-dashed border-[#E9E2D7] dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/50 dark:bg-zinc-900/30">
          <ImageIcon className="w-8 h-8 text-stone-400 dark:text-zinc-500 mb-1.5" />
          <p className="text-xs font-bold text-[#2D2D2A] dark:text-zinc-200">Nenhuma foto adicionada</p>
          <p className="text-2xs text-[#706B5F] dark:text-zinc-400 max-w-xs mt-0.5">
            Você pode adicionar múltiplas fotos do procedimento, ou deixar sem fotos.
          </p>
        </div>
      )}

      {/* Botões de Ação para Inserir Fotos */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setIsOpenGallery(!isOpenGallery)}
          className="px-3 py-1.5 bg-[#8C4E46] hover:bg-[#783e37] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{isOpenGallery ? 'Fechar Galeria' : 'Escolher da Galeria'}</span>
        </button>

        <label className="px-3 py-1.5 bg-stone-200 dark:bg-zinc-700 hover:bg-stone-300 dark:hover:bg-zinc-600 text-stone-800 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          <span>Enviar Fotos (Celular/PC)</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="px-2.5 py-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:text-zinc-100 text-xs font-medium flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>Adicionar via Link</span>
        </button>
      </div>

      {/* Input de URL externa */}
      {showUrlInput && (
        <form onSubmit={handleApplyCustomUrl} className="flex gap-2 pt-1">
          <input
            type="url"
            value={customUrlInput}
            onChange={(e) => setCustomUrlInput(e.target.value)}
            placeholder="Cole o link da foto (ex: https://...)"
            className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs text-stone-800 dark:text-zinc-200"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-stone-800 dark:bg-zinc-700 hover:bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Adicionar
          </button>
        </form>
      )}

      {/* Galeria de Fotos Curadas para Busca e Seleção Múltipla */}
      {isOpenGallery && (
        <div className="pt-3 border-t border-stone-200 dark:border-zinc-700 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar foto (ex: unhas em gel, corte degradê, mechas, cílios...)"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200"
              />
            </div>
          </div>

          {/* Categorias rápidas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-2xs scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#8C4E46] text-white'
                    : 'bg-stone-200 dark:bg-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid de Imagens */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
            {filteredImages.map((img) => {
              const isSelected = imageList.includes(img.url);
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      const idx = imageList.indexOf(img.url);
                      handleRemoveImage(idx);
                    } else {
                      handleAddImage(img.url);
                    }
                  }}
                  className={`group relative rounded-xl overflow-hidden aspect-4/3 border-2 transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-[#8C4E46] ring-2 ring-[#8C4E46]/40'
                      : 'border-transparent hover:border-[#8C4E46]/60'
                  }`}
                  title={img.title}
                >
                  <Image
                    src={img.url}
                    alt={img.title}
                    fill
                    sizes="120px"
                    className="object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#8C4E46]/40 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-[#8C4E46] text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1">
                    <p className="text-[9px] text-white font-semibold truncate leading-tight">
                      {img.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredImages.length === 0 && (
            <p className="text-xs text-stone-500 dark:text-zinc-500 text-center py-4">
              Nenhuma foto encontrada para a pesquisa &quot;{searchQuery}&quot;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
