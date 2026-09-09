export function enmascararEmail(email: string): string {
  const [usuario, dominio] = email.split('@');

  if (!usuario || !dominio) return email;

  return `${usuario.slice(0, 3)}****@${dominio}`;
}
