import { MagnifyingGlassIcon, ScalesIcon, ChartLineUpIcon } from '@phosphor-icons/react/dist/ssr';

export default function FeatureCards() {
  const steps = [
    {
      // Guardamos la referencia al componente, no un string ni un elemento instanciado
      Icon: MagnifyingGlassIcon,
      title: "1. Buscá y listá",
      desc: "Encontrá tus artículos diarios con precios reales de las cadenas locales."
    },
    {
      Icon: ScalesIcon,
      title: "2. Compará Sucursales",
      desc: "Analizá tu changuito completo y descubrí qué sucursal física es la más barata."
    },
    {
      Icon: ChartLineUpIcon,
      title: "3. Historial de Inflación",
      desc: "Seguí la variación mensual de precios para entender los aumentos en el tiempo."
    }
  ];

  return (
    <section className="py-6 border-t border-accent-300">
      <h2 className="text-lg font-black font-display text-slate-800 mb-5 text-center md:text-left">
        ¿Cómo optimizar tu compra?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, index) => {
          // Desestructuramos el componente con mayúscula para que React lo reconozca como tal
          const { Icon } = step;

          return (
            <div
              key={index}
              className="p-4 bg-white border border-accent-300 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              {/* Contenedor del ícono manteniendo tus clases originales */}
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
            </div>
          );
        })}
      </div>
    </section>
  );
}