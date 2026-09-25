# Sección /preguntas-frecuentes

Sigue la misma estructura modular descripta en el Readme para programadores
de LALIstaFrontend (`page.tsx` orquesta, `_components` dibuja, `_hooks`
maneja el estado, `_types` tipa, `_data` guarda el contenido).

## Cómo integrarla

1. Copiá toda la carpeta `preguntas-frecuentes/` dentro de `app/(main)/`
   de LALIstaFrontend (queda como `app/(main)/preguntas-frecuentes/`).
2. Con el flujo que ya usa el equipo:
   ```
   git checkout -b "feature/preguntas-frecuentes"
   npm run dev
   ```
   y entrá a `http://localhost:5000/preguntas-frecuentes` (o el puerto que
   uses) para verla en mobile primero (F12 → vista responsive) y después en
   escritorio.
3. Si el header/footer de `(main)` inyectan algún ancho máximo o padding
   propio, puede que quieras sacar el `max-w-2xl` de `page.tsx` para que
   coincida con el resto del sitio.
4. Si el proyecto ya tiene colores de marca definidos en `tailwind.config`,
   reemplazá `emerald-*` (usado solo en el foco del buscador) por el color
   de acento real. El resto de la paleta es neutra a propósito para no
   pisar el sistema de diseño que ya tengan.
5. Commit, push y PR como de costumbre.

## Cómo editarla después del testing con usuarios reales

No hace falta tocar ningún componente. Todo el contenido —preguntas,
respuestas y en qué categoría cae cada una— vive en un solo lugar:

```
_data/preguntas.ts
```

Para agregar, sacar o reformular una pregunta según lo que surja del
testing, se edita ese archivo y listo. Si aparece una categoría nueva, se
agrega al tipo `CategoriaFaq` en `_types/faq.ts` antes de usarla ahí.

## Qué incluye

- Buscador en tiempo real sobre pregunta y respuesta (`_hooks/useFaqAcordeon.ts`).
- Acordeón accesible: cada pregunta es un `<button>` con `aria-expanded` /
  `aria-controls`, navegable por teclado.
- Agrupación automática por categoría, en el orden en que aparecen en
  `_data/preguntas.ts`.
- Metadata de SEO (`title` / `description`) para la ruta.

## Qué falta decidir con el equipo

- Contenido validado 1:1 contra la propuesta de PP3 (SEPA, Zona Oeste:
  Ituzaingó / Morón / Castelar, canastas, etc.). Conviene que alguien más
  del equipo lo relea antes de mergear, sobre todo la pregunta sobre cuentas
  de usuario, según qué tan avanzado esté ese módulo al momento del merge.
- El link de "contanos" que se menciona en la última pregunta asume que el
  footer va a tener un canal de contacto. Si todavía no existe, conviene
  agregarlo antes de publicar la sección, o ajustar esa respuesta.
