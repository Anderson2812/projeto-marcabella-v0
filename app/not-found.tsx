import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="serif text-3xl font-bold text-[#2D2D2A] dark:text-zinc-100 mb-2">Página não encontrada</h2>
      <p className="text-stone-600 dark:text-zinc-400 text-sm mb-6">O endereço que você tentou acessar não existe ou foi movido.</p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-[#5A5A40] dark:bg-zinc-700 text-white rounded-xl text-sm font-bold shadow-xs hover:bg-[#484832] dark:hover:bg-zinc-600 transition-colors"
      >
        Voltar para a Página Inicial
      </Link>
    </div>
  );
}
