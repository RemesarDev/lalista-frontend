// Función auxiliar para validar y sanitizar el tamaño del metadata
function sanitizeAndValidateMetadata(metadata: any): { valid: boolean; sanitized: Record<string, any>; error?: string } {
    if (!metadata) return { valid: true, sanitized: {} };

    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
        return { valid: false, sanitized: {}, error: 'El campo metadata debe ser un objeto JSON válido' };
    }

    // Convertir a string para medir el tamaño en bytes / caracteres (Límite sugerido: 2000 caracteres)
    const jsonString = JSON.stringify(metadata);
    if (jsonString.length > 2000) {
        return { valid: false, sanitized: {}, error: 'El tamaño de la metadata excede el límite permitido (máx 2KB)' };
    }

    // Opcional: Limitar la cantidad de llaves internas para prevenir objetos profundamente anidados
    const keysCount = Object.keys(metadata).length;
    if (keysCount > 20) {
        return { valid: false, sanitized: {}, error: 'La metadata contiene demasiados atributos' };
    }

    return { valid: true, sanitized: metadata };
}
export { sanitizeAndValidateMetadata };