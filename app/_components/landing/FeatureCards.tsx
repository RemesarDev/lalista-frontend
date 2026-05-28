export default function FeatureCards() {
  const steps = [
    {
      icon: "🔍",
      title: "1. Buscá y Sumá",
      desc: "Encontrá tus artículos diarios con precios reales de las cadenas locales."
    },
    {
      icon: "📊",
      title: "2. Compará Sucursales",
      desc: "Analizá tu changuito completo y descubrí qué sucursal física es la más barata."
    },
    {
      icon: "📈",
      title: "3. Historial de Inflación",
      desc: "Seguí la variación diaria de precios para entender los aumentos en el tiempo."
    }
  ];

  return (
    <section className="py-6 border-t border-accent-300">
      <h2 className="text-lg font-black font-display text-slate-800 mb-5 text-center md:text-left">
        ¿Cómo optimizar tu compra?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className="p-4 bg-white border border-accent-300 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl p-2 bg-secondary-50 rounded-xl flex-shrink-0 text-primary-500">
              {step.icon}
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
        ))}
      </div>
    </section>
  );
}