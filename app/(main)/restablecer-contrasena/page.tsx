import { FormRestablecer } from './_components/FormRestablecer';

// Better Auth redirige acá desde el link del mail: con ?token=... si el token
// es válido, o con ?error=INVALID_TOKEN si venció o ya se usó.
export default async function RestablecerContrasenaPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { token, error } = await searchParams;
    const tokenValido = typeof token === 'string' && !error ? token : null;

    return <FormRestablecer token={tokenValido} />;
}
