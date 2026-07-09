import { useEffect, useRef } from "react";

export function usePrefetch<T>(importador: () => Promise<T>) {
    const moduloRef = useRef<T | null>(null);

    useEffect(() => {
        // La función que descarga el archivo
        const precargar = () => {
            importador()
                .then((modulo) => {
                    moduloRef.current = modulo;
                })
                .catch(console.error);
        };

        // Usamos el tiempo libre del navegador
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(precargar);
        } else {
            setTimeout(precargar, 1000);
        }
    }, [importador]); 

    // Devolvemos una función que el componente puede llamar cuando realmente necesite la librería
    const obtenerModulo = async (): Promise<T> => {
        // Si ya se descargó en segundo plano, lo devolvemos instantáneamente
        if (moduloRef.current) {
            return moduloRef.current;
        }
        // Si el usuario fue más rápido que la precarga, lo descargamos ahora bajo demanda
        const modulo = await importador();
        moduloRef.current = modulo;
        return modulo;
    };

    return obtenerModulo;
}