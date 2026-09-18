'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Check, Sparkles } from 'lucide-react';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
}

export default function ImageUploadField({
  value,
  onChange,
  label = 'Foto de Perfil da Profissional',
  description = 'Carregue uma foto nítida do rosto ou do espaço. Aceita JPG, PNG, WEBP.'
}: ImageUploadFieldProps) {
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    // Limite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        onChange(e.target.result);
      }
    };
    reader.onerror = () => {
      setError('Erro ao carregar a imagem. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[#706B5F] dark:text-zinc-400">
          {label}
        </label>
      )}

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-[#FAF8F5] dark:bg-zinc-800/50 border border-[#E9E2D7] dark:border-zinc-700">
        {/* Preview do Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-stone-200 relative flex items-center justify-center">
            {value ? (
              <Image
                src={value}
                alt="Foto do(a) profissional"
                fill
                sizes="96px"
                className="object-cover"
                referrerPolicy="no-referrer"
                unoptimized={value.startsWith('data:')}
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-stone-400" />
            )}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-xs cursor-pointer"
              title="Remover foto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controles de Upload */}
        <div className="flex-1 w-full space-y-2 text-center sm:text-left">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-[#5A5A40] dark:border-zinc-600 bg-[#EEF1EB]/50'
                : 'border-[#D9D1C5] hover:border-[#5A5A40] dark:border-zinc-600 hover:bg-white dark:bg-zinc-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#5A5A40] dark:text-zinc-300">
              <Upload className="w-4 h-4" />
              <span>Clique ou arraste uma foto aqui</span>
            </div>
            <p className="text-[11px] text-[#706B5F] dark:text-zinc-400 mt-0.5">
              JPG, PNG ou WEBP até 5MB
            </p>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[#5A5A40] dark:text-zinc-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <LinkIcon className="w-3 h-3" />
              {showUrlInput ? 'Ocultar campo de link' : 'Ou colar link da imagem (URL)'}
            </button>

            {value && (
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Foto carregada
              </span>
            )}
          </div>

          {showUrlInput && (
            <div className="flex gap-2 pt-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://exemplo.com/minha-foto.jpg"
                className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-[#E9E2D7] dark:border-zinc-700 rounded-xl text-xs text-[#2D2D2A] dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#5A5A40] dark:ring-zinc-600"
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-3 py-1.5 bg-[#5A5A40] dark:bg-zinc-700 hover:bg-[#484832] dark:hover:bg-zinc-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}

          {description && (
            <p className="text-[11px] text-[#706B5F] dark:text-zinc-400 leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
