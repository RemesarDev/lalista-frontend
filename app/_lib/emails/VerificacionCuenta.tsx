/** @jsxImportSource hono/jsx */
// app/_lib/emails/VerificacionCuenta.tsx
//
// Componente de email renderizado en servidor con hono/jsx. Pragma propio
// porque el resto del proyecto usa React (tsconfig tiene "jsx": "react-jsx");
// este pragma por archivo pisa esa config solo acá.
//
// hono/jsx escapa texto interpolado automaticamente (a diferencia del
// template literal anterior), asi que "nombre" no necesita sanitizarse a mano.

type Props = {
  nombre?: string;
  url: string;
  logoUrl: string;
};

const colores = {
  texto: '#1a1a1a',
  textoSecundario: '#666666',
  borde: '#e5e5e5',
  fondo: '#f5f5f5',
  boton: '#f97316', // primary-500 (orange-500) del tema
  link: '#f97316',
};

export function VerificacionCuenta({ nombre, url, logoUrl }: Props) {
  const saludo = nombre ? `Hola ${nombre},` : 'Hola,';

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: '24px',
          background: colores.fondo,
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: colores.texto,
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${colores.borde}`,
          }}
        >
          <div style={{ padding: '28px 32px 20px', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- esto renderiza a un string de HTML para un cliente de mail, nunca pasa por el pipeline de next/image */}
            <img
              src={logoUrl}
              alt="LALIsta"
              width="140"
              style={{ display: 'inline-block', height: 'auto' }}
            />
          </div>

          <div style={{ padding: '4px 32px 32px' }}>
            <h1 style={{ margin: '0 0 16px', fontSize: '20px', textAlign: 'center' }}>
              Verificá tu cuenta
            </h1>

            <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: '1.5' }}>{saludo}</p>

            <p style={{ margin: '0 0 28px', fontSize: '15px', lineHeight: '1.5' }}>
              Confirmá tu dirección de email para terminar de activar tu cuenta en LALIsta.
            </p>

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <a
                href={url}
                style={{
                  display: 'inline-block',
                  background: colores.boton,
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '13px 32px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                }}
              >
                Verificar mi cuenta
              </a>
            </div>

            <p style={{ margin: '0 0 8px', fontSize: '13px', color: colores.textoSecundario, lineHeight: '1.5' }}>
              Si el botón no funciona, copiá y pegá este link en tu navegador:
            </p>
            <p style={{ margin: '0 0 24px', fontSize: '13px', wordBreak: 'break-all' }}>
              <a href={url} style={{ color: colores.link }}>
                {url}
              </a>
            </p>

            <div style={{ borderTop: `1px solid ${colores.borde}`, paddingTop: '20px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: colores.textoSecundario, lineHeight: '1.5' }}>
                El link vence en 1 hora. Si no te registraste en LALIsta, ignorá este mensaje.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

// Fallback en texto plano para clientes sin HTML. Se mantiene aparte porque
// JSX no genera esta version solo.
export function textoVerificacionCuenta({ nombre, url }: Omit<Props, 'logoUrl'>): string {
  const saludo = nombre ? `Hola ${nombre},` : 'Hola,';
  return `${saludo}\n\nVerificá tu cuenta en LALIsta entrando a este link:\n${url}\n\nEl link vence en 1 hora. Si no te registraste, ignorá este mensaje.`;
}
