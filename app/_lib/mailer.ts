// app/_lib/mailer.ts
import nodemailer from 'nodemailer';

// ==========================================
// MAILER: Nodemailer sobre SMTP de Gmail
// Usa una App Password (2FA), no la clave de la cuenta.
// Ninguna de las dos variables lleva NEXT_PUBLIC_, asi que
// las credenciales nunca salen del servidor.
// ==========================================
const gmailUser = process.env.GMAIL_USER;
// Google muestra el app password en 4 grupos de 4 y suele quedar pegado con
// esos espacios en el .env: los sacamos para que el AUTH no falle por eso.
const gmailAppPass = process.env.GMAIL_APP_PASS?.replace(/\s/g, '');

if (!gmailUser || !gmailAppPass) {
  throw new Error('Faltan las variables de entorno de Gmail (GMAIL_USER / GMAIL_APP_PASS) en .env.local');
}

// El transporter se crea una sola vez por instancia (lambda) y se reusa entre
// invocaciones. No abre conexion hasta el primer sendMail.
export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: gmailUser,
    pass: gmailAppPass,
  },
});

const REMITENTE = `LALIsta <${gmailUser}>`;

// El nombre lo elige el usuario en el registro: va escapado para que no
// pueda inyectar HTML en el cuerpo del mail.
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================
// EMAIL DE VERIFICACION DE CUENTA
// ==========================================
export async function enviarEmailVerificacion({
  to,
  url,
  nombre,
}: {
  to: string;
  url: string;
  nombre?: string;
}): Promise<void> {
  const saludo = nombre ? `Hola ${escaparHtml(nombre)},` : 'Hola,';

  await transporter.sendMail({
    from: REMITENTE,
    to,
    subject: 'Verificá tu cuenta en LALIsta',
    text: `${nombre ? `Hola ${nombre},` : 'Hola,'}\n\nVerificá tu cuenta en LALIsta entrando a este link:\n${url}\n\nEl link vence en 1 hora. Si no te registraste, ignorá este mensaje.`,
    html: `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;">Verificá tu cuenta</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">${saludo}</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">
        Confirmá tu dirección de email para terminar de activar tu cuenta en LALIsta.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${url}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;">
          Verificar mi cuenta
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#666666;line-height:1.5;">
        Si el botón no funciona, copiá y pegá este link en tu navegador:
      </p>
      <p style="margin:0 0 24px;font-size:13px;word-break:break-all;">
        <a href="${url}" style="color:#1a6fd4;">${url}</a>
      </p>
      <p style="margin:0;font-size:13px;color:#666666;line-height:1.5;">
        El link vence en 1 hora. Si no te registraste en LALIsta, ignorá este mensaje.
      </p>
    </div>
  </body>
</html>`,
  });
}
