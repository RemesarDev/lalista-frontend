import Link from 'next/link';

export default function HeroInfo() {
  return (
    <section className="py-8 text-center md:text-left md:py-14 max-w-2xl mx-auto md:mx-0">
        
      <h1 className="text-3xl md:text-5xl font-black tracking-tight font-display text-slate-900 leading-tight">
        Salir a comprar no tiene por qué ser <span className="text-primary-400">una adivinanza</span>.
      </h1>
      
      <p className="mt-4 text-slate-600 text-sm md:text-base font-sans leading-relaxed">
        <strong className="block mt-2 text-slate-800 font-semibold">
          LALIsta te acompaña: camino las góndolas por vos para conocer los precios de cada comercio de tu zona. 
        </strong>
      </p>
      
      <div className="mt-6 md:hidden">
        <Link 
          href="/buscar" 
          className="inline-flex items-center justify-center w-full px-6 py-3 font-bold font-sans text-white bg-primary-500 rounded-xl shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all"
        >
          Armemos tu lista juntos
        </Link>
      </div>
    </section>
  );
}