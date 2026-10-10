// app/_lib/mailer.ts
import nodemailer from 'nodemailer';
import { VerificacionCuenta, textoVerificacionCuenta } from '@/app/_lib/emails/VerificacionCuenta';
import { RestablecerContrasena, textoRestablecerContrasena } from '@/app/_lib/emails/RestablecerContrasena';

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

// El transporter guarda solo configuracion: sin pool (el default), cada
// sendMail abre una conexion nueva y la cierra al terminar, asi que no queda
// ningun socket vivo entre invocaciones de la lambda.
export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: gmailUser,
    pass: gmailAppPass,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

const REMITENTE = `LALIsta <${gmailUser}>`;

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
  // El logo se referencia por URL absoluta (el cliente de mail lo descarga
  // de nuestro propio dominio), tomando el origin del link de verificacion
  // en vez de depender de otra variable de entorno.
  const logoUrl = `${new URL(url).origin}/img/lalista-logo.png`;

  // hono/jsx escapa "nombre" automaticamente al interpolarlo en el JSX, asi
  // que no hace falta sanitizarlo a mano como antes.
  const html = '<!DOCTYPE html>' + VerificacionCuenta({ nombre, url, logoUrl }).toString();

  await transporter.sendMail({
    from: REMITENTE,
    to,
    subject: 'Verificá tu cuenta en LALIsta',
    text: textoVerificacionCuenta({ nombre, url }),
    html,
  });
}

// ==========================================
// EMAIL DE RESTABLECER CONTRASENA
// ==========================================
export async function enviarEmailRestablecerContrasena({
  to,
  url,
  nombre,
}: {
  to: string;
  url: string;
  nombre?: string;
}): Promise<void> {
  // Mismo criterio que el de verificacion para el logo.
  const logoUrl = `${new URL(url).origin}/img/lalista-logo.png`;
  const html = '<!DOCTYPE html>' + RestablecerContrasena({ nombre, url, logoUrl }).toString();

  await transporter.sendMail({
    from: REMITENTE,
    to,
    subject: 'Restablecé tu contraseña en LALIsta',
    text: textoRestablecerContrasena({ nombre, url }),
    html,
  });
}
