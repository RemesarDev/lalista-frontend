import Link from 'next/link';

export default function HeroInfo() {
  return (
    <section className="py-8 text-center md:text-left md:py-14 max-w-2xl mx-auto md:mx-0">
      <span className="inline-block bg-secondary-50 text-primary-400 border border-orange-200 text-xs font-bold px-3 py-1 rounded-full mb-4 font-sans">
        📍 Conectado a Zona Oeste Hubs
      </span>
      <h1 className="text-3xl md:text-5xl font-black tracking-tight font-display text-slate-900 leading-tight">
        Cuidá tu bolsillo.<br />
        Ahorrá en el súper de <span className="text-primary-400">tu barrio</span>.
      </h1>
      <p className="mt-4 text-slate-600 text-sm md:text-base font-sans leading-relaxed">
        Buscá tus productos, armá tu lista y nuestro motor comparará las góndolas de los principales súper de tu zona para decirte **dónde pagás menos en total**.
      </p>
      
      <div className="mt-6 md:hidden">
        <Link 
          href="/buscar" 
          className="inline-flex items-center justify-center w-full px-6 py-3 font-bold font-sans text-white bg-primary-500 rounded-xl shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all"
        >
          Comenzar a ahorrar
        </Link>
      </div>
    </section>
  );
}