import type { Pregunta } from "../_types/faq";

/**
 * Contenido de Preguntas Frecuentes.
 *
 * Este es el ÚNICO archivo que hace falta tocar para agregar, sacar o
 * reescribir preguntas después del testing con usuarios reales. No requiere
 * tocar ningún componente: el orden en el que aparecen acá adentro es el
 * orden en el que se muestran dentro de cada categoría.
 */
export const preguntas: Pregunta[] = [
  {
    id: "que-es-lalista",
    categoria: "General",
    pregunta: "¿Qué es Lalista?",
    respuesta:
      "Lalista es una herramienta gratuita, desarrollada como proyecto académico, que te ayuda a comparar el precio de tu compra habitual entre los comercios cercanos a vos. Tomamos los datos oficiales que publica el Gobierno a través del SEPA (Sistema Electrónico de Publicidad de Precios Argentinos), los organizamos, y te mostramos en qué comercio tu canasta completa sale más barata, sin que tengas que recorrer sucursales para comparar.",
  },
  {
    id: "costo",
    categoria: "General",
    pregunta: "¿Tiene algún costo usarla?",
    respuesta:
      "No. Lalista es y va a seguir siendo gratuita. Tampoco necesitás instalar nada: funciona directamente desde el navegador de tu celular o tu computadora.",
  },
  {
    id: "fuente-precios",
    categoria: "Los datos y los precios",
    pregunta: "¿De dónde saca Lalista los precios?",
    respuesta:
      "De la base de datos oficial de precios que publica diariamente la Subsecretaría de Defensa del Consumidor y Lealtad Comercial (SEPA). Nosotros descargamos esa información, la limpiamos y la organizamos para que sea fácil de consultar y comparar.",
  },
  {
    id: "frecuencia-actualizacion",
    categoria: "Los datos y los precios",
    pregunta: "¿Cada cuánto se actualizan los precios?",
    respuesta:
      "La carga corre todos los días de forma automática, así que la información que ves refleja la última publicación disponible del SEPA. De todas formas, al depender de lo que cada comercio informa, puede haber alguna diferencia puntual con el precio de góndola.",
  },
  {
    id: "precio-exacto",
    categoria: "Los datos y los precios",
    pregunta: "¿El precio que veo en Lalista es el que voy a pagar en la caja?",
    respuesta:
      "En la mayoría de los casos sí, porque la información sale directamente de la fuente oficial. Puede haber alguna diferencia puntual si un comercio actualizó un precio después de la última carga, o si hay una promoción que todavía no contempla nuestro sistema. Por eso conviene usar Lalista como guía para decidir a dónde ir a comprar, más que como precio garantizado.",
  },
  {
    id: "necesito-cuenta",
    categoria: "Cómo usar LALIsta",
    pregunta: "¿Necesito crear una cuenta para usarla?",
    respuesta:
      "No hace falta una cuenta para buscar productos y comparar precios. Si querés guardar tu canasta para reutilizarla sin cargarla de cero cada vez, te conviene crear un perfil: así tus canastas y tus preferencias quedan guardadas.",
  },
  {
    id: "armar-canasta",
    categoria: "Cómo usar LALIsta",
    pregunta: "¿Cómo armo mi canasta de compras?",
    respuesta:
      "Buscá los productos que solés comprar, indicá la cantidad de cada uno y agregalos a tu canasta. Una vez armada, Lalista calcula el costo total de esa canasta en los comercios cercanos a la ubicación que elijas y te muestra un ranking ordenado de menor a mayor precio.",
  },
  {
    id: "elegir-ubicacion",
    categoria: "Cómo usar LALIsta",
    pregunta: "¿Puedo comparar precios en una ubicación que no es la mía?",
    respuesta:
      "Sí. Podés dejar que la app use tu ubicación actual o ingresar manualmente otra dirección, por ejemplo la zona donde vas a hacer la compra grande del mes.",
  },
  {
    id: "varias-canastas",
    categoria: "Cómo usar LALIsta",
    pregunta: "¿Puedo guardar más de una canasta?",
    respuesta:
      "Sí. Podés armar y guardar varias canastas —por ejemplo, una de almacén y otra de limpieza— para no tener que cargarlas de nuevo cada vez que quieras comparar precios.",
  },
  {
    id: "cobertura-actual",
    categoria: "Cobertura y próximos pasos",
    pregunta: "¿En qué localidades funciona Lalista hoy?",
    respuesta:
      "Por el momento cubrimos Ituzaingó, Morón y Castelar, en la Zona Oeste del Gran Buenos Aires. Elegimos empezar por esta zona para poder validar bien la herramienta antes de expandirla a otras localidades.",
  },
  {
    id: "datos-guardados",
    categoria: "Tus datos y tu privacidad",
    pregunta: "¿Qué datos míos guarda Lalista?",
    respuesta:
      "Guardamos solo lo necesario para que tu canasta funcione: los productos que agregaste y, si creás un perfil, tus preferencias de búsqueda. No pedimos datos sensibles y no compartimos tu información con los comercios. Lalista es un proyecto académico en etapa de prueba, así que te pedimos que evites cargar información personal que no sea estrictamente necesaria.",
  },
  {
    id: "reportar-precio",
    categoria: "Tus datos y tu privacidad",
    pregunta: "¿Puedo avisar si encuentro un precio mal cargado?",
    respuesta:
      "Todavía no de forma automática, pero es una función que tenemos planeada. Mientras tanto, si notás algo raro en los precios, contanos por los canales de contacto del pie de página: ese tipo de comentarios es justo lo que necesitamos en esta etapa de pruebas con usuarios reales.",
  },
];
