import Link from 'next/link';
import { MagnifyingGlassIcon, ShoppingCartIcon, ScalesIcon, ChartLineUpIcon } from '@phosphor-icons/react/dist/ssr';

export default function FeatureCards() {
  const steps = [
    {
      Icon: MagnifyingGlassIcon,
      title: "1. Buscá",
      desc: "Encontrá tus artículos diarios con precios reales de las cadenas locales.",
      href: "/buscar",
    },
    {
      Icon: ShoppingCartIcon,
      title: "2. Listá",
      desc: "Administrá tu lista de supermercado diariamente.",
      href: "/mi-lista",
    },
    {
      Icon: ScalesIcon,
      title: "3. Compará",
      desc: "Analizá tu changuito completo y descubrí qué sucursal física es la más barata.",
      href: "/comparativa",
    },
    {
      Icon: ChartLineUpIcon,
      title: "4. Calculá",
      desc: "Seguí la variación mensual de precios para entender los aumentos en el tiempo.",
      href: "/calculadora",
    },
  ];

  return (
    <section id="como-funciona" className="py-6 border-t border-accent-300">
      <h2 className="text-lg font-black font-display text-slate-800 mb-5 text-center md:text-left">
        ¿Cómo optimizar tu compra?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, index) => {
          const { Icon } = step;
          return (
            <Link
              key={index}
              href={step.href}
              className="p-4 bg-white border border-accent-300 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow-md hover:border-primary-400 active:scale-[0.98] transition-all"
            >
              <div className="text-2xl p-2 bg-secondary-50 rounded-xl shrink-0 text-primary-500">
                <Icon size={24} weight="regular" />
              </div>
              <div>
                <h3 className="font-bold font-display text-slate-950 text-sm md:text-base">
                  {step.title}
                </h3>
                <p className="text-xs font-sans text-slate-500 mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}