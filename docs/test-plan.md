# Plan de Testing — LALIsta MVP3

## 1. Objetivo

Validar las funcionalidades principales y APIs críticas de LALIsta para el MVP3,
identificando errores, verificando los contratos de las APIs y generando evidencia
reproducible de las pruebas realizadas.

## 2. Estrategia de testing

Se realizarán pruebas:

- Funcionales
- Positivas (happy path)
- Negativas
- Validación de inputs
- Autenticación/autorización
- Límites y casos extremos
- Rate limiting
- Logging
- Geobloqueo

Las pruebas de API se ejecutarán utilizando Bruno.

Los defectos encontrados serán documentados, corregidos cuando corresponda
y posteriormente sometidos a re-test.

## 3. Casos ejecutados

| ID           | Escenario             | Resultado                | Estado |
| ------------ | --------------------- | ------------------------ | ------ |
| `TC-PROD-01` | Sin `sucursales_ids`  | `400 ZodError`           | ✅ PASS |
| TC-PROD-02 | GET /api/productos?lat=-34.6037&lng=-58.3816&radio=5 | Consulta con parámetros válidos | 200 + campo `productos` | 200 + `productos: []` | PASS |
| `TC-PROD-03` | `/producto/abc`       | `400` + mensaje esperado | ✅ PASS |
| `TC-PROD-04` | `/producto/999999999` | `404`                    | ✅ PASS |


## 4. Evidencias

Las ejecuciones se realizarán mediante Bruno y se conservarán evidencias
de los principales escenarios de prueba, errores encontrados, correcciones
y re-tests.

## 5. Defectos encontrados

Los defectos encontrados durante las pruebas se documentarán indicando:

- ID del defecto
- Endpoint/funcionalidad afectada
- Pasos para reproducir
- Resultado esperado
- Resultado obtenido
- Severidad
- Corrección realizada
- Resultado del re-test

## 6. Criterios de validación de APIs

Además del código HTTP esperado, cuando corresponde se valida:

- Estructura de la respuesta.
- Tipo de los campos principales.
- Mensajes de error definidos por el contrato.
- Comportamiento ante inputs inválidos.
- Comportamiento ante recursos inexistentes.