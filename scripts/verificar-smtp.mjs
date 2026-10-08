// Verifica las credenciales de Gmail sin pasar por la app.
//
//   npm run verificar:smtp                      -> solo LOGIN, no manda nada
//   npm run verificar:smtp -- --enviar vos@mail -> manda un mail de prueba
//
// Replica la config de app/_lib/mailer.ts (smtp.gmail.com:465, secure).
import nodemailer from 'nodemailer';

const user = process.env.GMAIL_USER;
const passCrudo = process.env.GMAIL_APP_PASS;
const destinatario = process.argv.includes('--enviar')
  ? process.argv[process.argv.indexOf('--enviar') + 1]
  : null;

if (!user || !passCrudo) {
  console.error('Faltan GMAIL_USER o GMAIL_APP_PASS. Corrida esperada: npm run verificar:smtp');
  process.exit(1);
}

// Mismo saneado que el mailer: Google muestra la clave en 4 grupos de 4.
const pass = passCrudo.replace(/\s/g, '');

// Diagnostico de forma, sin imprimir la credencial.
const formatoGoogle = /^[a-z]{16}$/.test(pass);
console.log(`cuenta:  ${user}`);
console.log(`clave:   ${pass.length} caracteres${formatoGoogle ? '' : '  <-- OJO: Google genera 16 letras minusculas'}`);
if (!formatoGoogle) {
  console.log('         esto no tiene el formato de un app password; revisa que no sea');
  console.log('         la contrasena de la cuenta ni este cortada al pegarla.');
}
console.log('');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user, pass },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

try {
  await transporter.verify();
  console.log('LOGIN OK: Gmail acepto la credencial.');

  if (destinatario) {
    const info = await transporter.sendMail({
      from: `LALIsta <${user}>`,
      to: destinatario,
      subject: 'Prueba de SMTP de LALIsta',
      text: 'Si leés esto, el envío de mails funciona.',
    });
    console.log(`ENVIO OK: mail aceptado para ${destinatario} (id ${info.messageId})`);
  } else {
    console.log('(no se envio ningun mail; agrega --enviar tu@mail.com para probar end to end)');
  }
} catch (error) {
  const msg = String(error?.message ?? error);
  console.error(`FALLO: ${msg}\n`);

  if (msg.includes('535')) {
    console.error('Gmail rechazo la credencial. Causas, en orden de probabilidad:');
    console.error('  1. Alguien cambio la contrasena de la cuenta: eso revoca TODOS los');
    console.error('     app passwords. Hay que generar uno nuevo.');
    console.error('  2. La 2FA de la cuenta esta configurada solo con llaves de seguridad.');
    console.error('     Agrega un segundo factor mas (app autenticadora o telefono).');
    console.error('  3. La cuenta tiene Proteccion Avanzada activada: ahi no hay app passwords.');
    console.error('  Generar uno nuevo: https://myaccount.google.com/apppasswords');
  } else if (msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
    console.error('No se llego al servidor: lo bloquea la red, no las credenciales.');
  }
  process.exitCode = 1;
} finally {
  transporter.close();
}
