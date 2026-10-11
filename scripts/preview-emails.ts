// scripts/preview-emails.ts
//
// Servidor local para ver los emails en el navegador, sin levantar Next ni
// necesitar credenciales de Gmail. Se corre con `npm run emails`: tsx watch
// reinicia el servidor al editar un template y la pagina se recarga sola.
//   http://localhost:3001/                       indice
//   http://localhost:3001/verificacion?nombre=   (nombre vacio = saludo sin nombre)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { VerificacionCuenta } from '../app/_lib/emails/VerificacionCuenta';
import { RestablecerContrasena } from '../app/_lib/emails/RestablecerContrasena';

const PUERTO = Number(process.env.PUERTO ?? 3001);
const origin = `http://localhost:${PUERTO}`;

const plantillas = {
  verificacion: VerificacionCuenta,
  restablecer: RestablecerContrasena,
};

// Recarga automatica: la pagina mantiene abierta una conexion SSE con el
// servidor. Cuando tsx watch lo reinicia, la conexion se corta, EventSource
// reconecta solo y, al volver a abrirse, la pagina se recarga. Se inyecta solo
// en el preview, nunca en el HTML que se manda por mail.
const SCRIPT_RECARGA = `<script>
  let conectado = false;
  new EventSource('/__recarga').onopen = () => (conectado ? location.reload() : (conectado = true));
</script>`;

const servidor = createServer(async (req, res) => {
  const { pathname, searchParams } = new URL(req.url ?? '/', origin);

  if (pathname === '/__recarga') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    res.write('retry: 300\n\n');
    return;
  }

  // El logo se sirve desde public/, igual que en el sitio.
  if (pathname === '/img/lalista-logo.png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(await readFile(join(process.cwd(), 'public/img/lalista-logo.png')));
    return;
  }

  const Plantilla = plantillas[pathname.slice(1) as keyof typeof plantillas];
  if (!Plantilla) {
    const links = Object.keys(plantillas).map((p) => `<li><a href="/${p}">${p}</a></li>`).join('');
    res.writeHead(pathname === '/' ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><h1>Emails</h1><ul>${links}</ul>`);
    return;
  }

  const html =
    '<!DOCTYPE html>' +
    Plantilla({
      nombre: searchParams.get('nombre') ?? 'Josué',
      url: `${origin}/ejemplo?token=abc123`,
      logoUrl: `${origin}/img/lalista-logo.png`,
    }).toString();

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html.replace('</body>', `${SCRIPT_RECARGA}</body>`));
});

// Al guardar, tsx watch puede reiniciar antes de que el proceso anterior
// suelte el puerto: en ese caso se reintenta en vez de caerse.
servidor.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code !== 'EADDRINUSE') throw err;
  setTimeout(() => servidor.listen(PUERTO), 200);
});
servidor.listen(PUERTO, () => console.log(`Preview de emails en ${origin}`));
