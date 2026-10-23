# Plan de Testing — LALIsta MVP3

## 1. Objetivo

Validar las funcionalidades principales y APIs críticas de LALIsta para el MVP3, identificando errores, verificando los contratos de las APIs y generando evidencia reproducible de las pruebas realizadas.

El objetivo principal del testing es verificar que los flujos críticos funcionen correctamente, detectar defectos, documentar las correcciones realizadas y ejecutar re-tests para comprobar que los problemas hayan sido resueltos.

---

## 2. Estrategia de testing

Se realizarán pruebas:

* Funcionales.
* Positivas (happy path).
* Negativas.
* Validación de inputs.
* Autenticación/autorización, cuando corresponda.
* Límites y casos extremos.
* Rate limiting.
* Logging.
* Usabilidad y presentación.
* Geobloqueo.

Las pruebas de API se ejecutarán utilizando **Bruno**, registrando requests, responses y assertions como evidencia.

Las pruebas manuales de interfaz se utilizarán para validar comportamiento visual, búsqueda y presentación de resultados.

Los defectos encontrados serán documentados indicando el escenario, resultado esperado, resultado obtenido, corrección aplicada y resultado del re-test.

---

# 3. Casos de prueba ejecutados

## 3.1. Productos

### TC-PROD-01 — Validación de parámetro obligatorio

| Campo              | Detalle                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| ID                 | `TC-PROD-01`                                                            |
| Endpoint           | `GET /api/productos`                                                    |
| Tipo               | Negativa / validación de input                                          |
| Precondición       | Ninguna                                                                 |
| Entrada            | Request sin `sucursales_ids`                                            |
| Resultado esperado | La API debe rechazar la solicitud por falta de un parámetro obligatorio |
| Resultado obtenido | HTTP `400` con error de validación                                      |
| Estado             | ✅ PASS                                                                  |
| Herramienta        | Bruno                                                                   |

---

### TC-PROD-02 — Consulta de productos con sucursales válidas

| Campo              | Detalle                                         |
| ------------------ | ----------------------------------------------- |
| ID                 | `TC-PROD-02`                                    |
| Endpoint           | `GET /api/productos?sucursales_ids=1,2`         |
| Tipo               | Funcional / happy path                          |
| Precondición       | Endpoint disponible                             |
| Entrada            | `sucursales_ids=1,2`                            |
| Resultado esperado | HTTP `200` y respuesta con el campo `productos` |
| Resultado obtenido | HTTP `200`, `productos: []` y `hasMore: false`  |
| Estado             | ✅ PASS                                          |
| Herramienta        | Bruno                                           |

---

### TC-PROD-03 — Validación de ID de producto inválido

| Campo              | Detalle                                          |
| ------------------ | ------------------------------------------------ |
| ID                 | `TC-PROD-03`                                     |
| Endpoint           | `GET /api/producto/abc`                          |
| Tipo               | Negativa / validación de input                   |
| Entrada            | ID no numérico: `abc`                            |
| Resultado esperado | HTTP `400` con mensaje de ID inválido            |
| Resultado obtenido | HTTP `400` con mensaje `Id de producto invalido` |
| Estado             | ✅ PASS                                           |
| Herramienta        | Bruno                                            |

---

### TC-PROD-04 — Producto inexistente

| Campo              | Detalle                        |
| ------------------ | ------------------------------ |
| ID                 | `TC-PROD-04`                   |
| Endpoint           | `GET /api/producto/999999999`  |
| Tipo               | Negativa / recurso inexistente |
| Entrada            | ID numérico inexistente        |
| Resultado esperado | HTTP `404`                     |
| Resultado obtenido | HTTP `404`                     |
| Estado             | ✅ PASS                         |
| Herramienta        | Bruno                          |

---

### TC-PROD-05 — Consulta de productos con sucursal real

| Campo              | Detalle                                                                         |
| ------------------ | ------------------------------------------------------------------------------- |
| ID                 | `TC-PROD-05`                                                                    |
| Endpoint           | `GET /api/productos?sucursales_ids=9-1-153`                                     |
| Tipo               | Funcional / integración con datos reales                                        |
| Precondición       | Existencia de la sucursal `9-1-153` en los datos                                |
| Resultado esperado | HTTP `200`, campo `productos` y productos con identificador                     |
| Resultado obtenido | HTTP `200`, productos devueltos correctamente y todos poseen identificador `id` |
| Assertions         | 6/6 PASS                                                                        |
| Estado             | ✅ PASS                                                                          |
| Herramienta        | Bruno                                                                           |

---

### TC-PROD-06 — Búsqueda de productos por texto

| Campo              | Detalle                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| ID                 | `TC-PROD-06`                                                                   |
| Endpoint           | `GET /api/productos?sucursales_ids=9-1-153&search=aceite`                      |
| Tipo               | Funcional / búsqueda                                                           |
| Entrada            | `search=aceite`                                                                |
| Resultado esperado | HTTP `200`, resultados asociados al término buscado y campo `hasMore`          |
| Resultado obtenido | HTTP `200`, múltiples productos con "aceite" en el nombre y `hasMore` presente |
| Assertions         | 6/6 PASS                                                                       |
| Estado             | ✅ PASS                                                                         |
| Herramienta        | Bruno                                                                          |

---

## 3.2. Mapas y sucursales cercanas

### TC-MAPS-01 — Sucursales dentro de radio de búsqueda

| Campo              | Detalle                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| ID                 | `TC-MAPS-01`                                                                   |
| Endpoint           | `GET /api/maps/sucursales-cercanas`                                            |
| Tipo               | Funcional / geolocalización                                                    |
| Entrada            | `lat=-34.690047`, `lng=-58.689142`, `radio=3`                                  |
| Resultado esperado | HTTP `200`, lista de sucursales y resultados dentro de un radio máximo de 3 km |
| Resultado obtenido | HTTP `200`, 4 sucursales encontradas. La sucursal `10-3-479` aparece a 0 km    |
| Assertions         | 6/6 PASS                                                                       |
| Estado             | ✅ PASS                                                                         |
| Herramienta        | Bruno                                                                          |

---

### TC-MAPS-02 — Radio mínimo de búsqueda

| Campo              | Detalle                                                           |
| ------------------ | ----------------------------------------------------------------- |
| ID                 | `TC-MAPS-02`                                                      |
| Endpoint           | `GET /api/maps/sucursales-cercanas`                               |
| Tipo               | Funcional / límite                                                |
| Entrada            | `lat=-34.690047`, `lng=-58.689142`, `radio=1`                     |
| Resultado esperado | HTTP `200` y solamente sucursales ubicadas dentro de 1 km         |
| Resultado obtenido | HTTP `200`, 1 sucursal encontrada: `10-3-479`, con distancia 0 km |
| Assertions         | 6/6 PASS                                                          |
| Estado             | ✅ PASS                                                            |
| Herramienta        | Bruno                                                             |

---

### TC-MAPS-03 — Validación de radio máximo

| Campo                           | Detalle                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------- |
| ID                              | `TC-MAPS-03`                                                                 |
| Endpoint                        | `GET /api/maps/sucursales-cercanas`                                          |
| Tipo                            | Negativa / límite / regresión                                                |
| Entrada inicial                 | `radio=999999`                                                               |
| Resultado esperado inicial      | La API debe rechazar un radio superior al máximo permitido por la aplicación |
| Resultado obtenido inicialmente | HTTP `200`, 27 sucursales y resultados a más de 10 km                        |
| Estado inicial                  | ❌ FAIL                                                                       |
| Defecto                         | `DEF-MAPS-01`                                                                |
| Corrección                      | Se agregó validación `.max(10)` al schema del backend                        |
| Re-test                         | `radio=999999`                                                               |
| Resultado del re-test           | HTTP `400`, respuesta de validación con `success=false`                      |
| Assertions del re-test          | 3/3 PASS                                                                     |
| Estado final                    | ✅ PASS                                                                       |
| Herramienta                     | Bruno                                                                        |

---

## 3.3. Rate limiting

### TC-RATE-01 — Límite de peticiones por IP

| Campo                   | Detalle                                                                    |
| ----------------------- | -------------------------------------------------------------------------- |
| ID                      | `TC-RATE-01`                                                               |
| Endpoint                | `GET /api/productos`                                                       |
| Tipo                    | Seguridad / límite de peticiones                                           |
| Límite esperado         | 50 requests cada 60 segundos                                               |
| Primera ejecución       | 55 requests, inicialmente todas respondieron `200`                         |
| Investigación           | Se instrumentó el middleware y se verificó que el contador se incrementaba |
| Re-ejecución controlada | Se reinició el servidor y se repitió la prueba                             |
| Resultado de re-test    | Requests 1–50: `200`; request 51: `429`                                    |
| Estado                  | ✅ PASS                                                                     |
| Alcance                 | Validado en entorno local                                                  |

**Conclusión:** el mecanismo de rate limiting funciona correctamente en el entorno local utilizado para la prueba.

**Consideración:** al utilizar un contador en memoria, la estrategia deberá revisarse para un entorno distribuido/serverless como Vercel si se requiere garantizar el límite de manera global entre múltiples instancias.

---

## 3.4. Sesiones

### TC-SESSION-01 — Registro de sesiones

| Campo              | Detalle                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| ID                 | `TC-SESSION-01`                                                               |
| Tipo               | Funcional / persistencia                                                      |
| Objetivo           | Verificar el registro de información asociada a las sesiones                  |
| Resultado esperado | La sesión debe persistir información de creación, expiración, IP y User-Agent |
| Resultado obtenido | Better Auth persiste la información correspondiente en la tabla `session`     |
| Implementación     | Se mantiene la funcionalidad nativa de Better Auth                            |
| Estado             | ✅ PASS                                                                        |

**Conclusión:** el registro de sesiones requerido para MVP3 se encuentra implementado mediante la funcionalidad nativa de Better Auth.

---

## 3.5. Logging

### TC-LOG-01 — Logging global de errores no controlados

| Campo                 | Detalle                                                                       |
| --------------------- | ----------------------------------------------------------------------------- |
| ID                    | `TC-LOG-01`                                                                   |
| Tipo                  | Funcional / observabilidad                                                    |
| Objetivo              | Verificar el registro de errores no controlados de la API                     |
| Implementación        | Manejador global `app.onError()`                                              |
| Prueba inicial        | Se creó temporalmente `/api/test-error` para generar una excepción controlada |
| Resultado esperado    | HTTP `500` y generación de log estructurado                                   |
| Resultado obtenido    | HTTP `500` y log con timestamp, método, ruta, status y mensaje de error       |
| Re-test               | Se eliminó el endpoint de prueba y se verificó `/api/no-existe`               |
| Resultado del re-test | HTTP `404` sin generación de `[API ERROR]`                                    |
| Estado                | ✅ PASS                                                                        |

**Conclusión:** el backend cuenta con logging global para errores no controlados. Los errores explícitamente manejados por los routers continúan utilizando sus mecanismos específicos de logging.

**Pendiente/futuro:** persistencia de logs para consulta histórica, monitoreo y análisis posterior.

---

## 3.6. Usabilidad e interfaz

### TC-UX-01 — Normalización de nombres de productos

| Campo              | Detalle                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| ID                 | `TC-UX-01`                                                              |
| Tipo               | Usabilidad / presentación                                               |
| Método             | Prueba manual en interfaz                                               |
| Objetivo           | Verificar que los nombres de productos se presenten con formato legible |
| Resultado esperado | Nombre en minúscula, con únicamente la primera inicial en mayúscula     |
| Resultado obtenido | Los nombres se presentan con el formato esperado                        |
| Evidencia          | Captura de pantalla de búsqueda/resultados                              |
| Estado             | ✅ PASS                                                                  |

---

### TC-UX-02 — Corrección predictiva de búsqueda

| Campo              | Detalle                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| ID                 | `TC-UX-02`                                                                              |
| Tipo               | Funcional / usabilidad                                                                  |
| Método             | Prueba manual en interfaz                                                               |
| Objetivo           | Verificar que una búsqueda con error de escritura pueda recuperar resultados relevantes |
| Resultado esperado | El sistema muestra resultados asociados a la intención de búsqueda/corrección esperada  |
| Resultado obtenido | Se obtuvieron resultados relevantes ante la búsqueda incorrecta                         |
| Evidencia          | Captura de la búsqueda incorrecta y resultados obtenidos                                |
| Estado             | ✅ PASS                                                                                  |

---

# 4. Evidencias de testing

Las evidencias se obtuvieron mediante Bruno, ejecución local del backend y pruebas manuales de interfaz.

## 4.1. Evidencia TC-PROD-01

* Request sin `sucursales_ids`.
* Resultado: HTTP `400`.
* Se verificó que la API rechaza la solicitud por ausencia de un parámetro obligatorio.
* Estado: **PASS**.

## 4.2. Evidencia TC-PROD-02

* Request: `GET /api/productos?sucursales_ids=1,2`.
* Resultado: HTTP `200`.
* Response con `productos: []` y `hasMore: false`.
* Estado: **PASS**.

## 4.3. Evidencia TC-PROD-03

* Request: `GET /api/producto/abc`.
* Resultado: HTTP `400`.
* Mensaje: `Id de producto invalido`.
* Estado: **PASS**.

## 4.4. Evidencia TC-PROD-04

* Request: `GET /api/producto/999999999`.
* Resultado: HTTP `404`.
* Estado: **PASS**.

## 4.5. Evidencia TC-PROD-05

* Request: `GET /api/productos?sucursales_ids=9-1-153`.
* Se utilizaron datos reales existentes en la base.
* Resultado: HTTP `200`.
* Los productos devueltos poseen identificador `id`.
* Assertions: **6/6 PASS**.
* Estado: **PASS**.

## 4.6. Evidencia TC-PROD-06

* Request: `GET /api/productos?sucursales_ids=9-1-153&search=aceite`.
* Resultado: HTTP `200`.
* Se obtuvieron múltiples productos asociados al término "aceite".
* Se verificó que los resultados contienen identificador y que `hasMore` está presente.
* Assertions: **6/6 PASS**.
* Estado: **PASS**.

## 4.7. Evidencia TC-MAPS-01

* Request ejecutado en Bruno con coordenadas correspondientes a una sucursal real.
* Radio utilizado: `3 km`.
* Resultado: HTTP `200`.
* Se encontraron 4 sucursales.
* La sucursal `10-3-479` fue encontrada a distancia `0 km`.
* Se verificó que todas las sucursales devueltas están dentro del radio solicitado.
* Assertions: **6/6 PASS**.
* Estado: **PASS**.

## 4.8. Evidencia TC-MAPS-02

* Request ejecutado con radio de `1 km`.
* Resultado: HTTP `200`.
* Se obtuvo exactamente la sucursal de referencia `10-3-479`.
* Distancia registrada: `0 km`.
* Assertions: **6/6 PASS**.
* Estado: **PASS**.

## 4.9. Evidencia TC-MAPS-03 — Defecto y re-test

### Ejecución inicial

* Request con `radio=999999`.
* Resultado: HTTP `200`.
* Se devolvieron 27 sucursales.
* Se detectaron resultados ubicados a más de 10 km.
* Las assertions relacionadas con el límite fallaron.
* Resultado inicial: **FAIL**.

### Defecto encontrado

La API permitía solicitar radios superiores al máximo definido por la aplicación.

### Corrección

Se incorporó validación de rango en el schema del backend:

* Radio mínimo: `1 km`.
* Radio máximo: `10 km`.

### Re-test

Se repitió la misma solicitud con `radio=999999`.

* Resultado: HTTP `400`.
* La respuesta indica que la solicitud no es válida.
* Assertions: **3/3 PASS**.
* Resultado final: **PASS**.

---

## 4.10. Evidencia TC-RATE-01

### Primera ejecución

* Se realizaron 55 requests.
* Inicialmente todas respondieron HTTP `200`.
* Se investigó el middleware y se verificó el incremento del contador.

### Re-ejecución controlada

* Se reinició el servidor.
* Requests 1–50: HTTP `200`.
* Request 51: HTTP `429`.

### Conclusión

El mecanismo de rate limiting funciona correctamente en el entorno local utilizado para la prueba.

---

## 4.11. Evidencia TC-SESSION-01

Se verificó la persistencia de las sesiones mediante Better Auth.

La tabla `session` conserva información relacionada con:

* Fecha de creación.
* Fecha de expiración.
* Dirección IP.
* User-Agent.

Resultado: **PASS**.

---

## 4.12. Evidencia TC-LOG-01

Se incorporó un manejador global `app.onError()` para registrar errores no controlados de la API. Hono documenta `app.onError()` como mecanismo para manejar errores no capturados y devolver una respuesta personalizada.

### Prueba

Se creó temporalmente el endpoint `/api/test-error`, diseñado exclusivamente para generar una excepción controlada.

### Resultado

La solicitud devolvió HTTP `500` y se generó un log estructurado con:

* Timestamp.
* Método HTTP.
* Ruta.
* Status.
* Mensaje de error.

### Re-test

Se eliminó el endpoint de prueba y se verificó una ruta inexistente:

`GET /api/no-existe`

Resultado:

* HTTP `404`.
* No se generó `[API ERROR]`.

### Conclusión

El logging global funciona para errores no controlados sin confundirlos con respuestas `404` correspondientes a rutas inexistentes.

Resultado: **PASS**.

---

## 4.13. Evidencia TC-UX-01

Se realizó una prueba manual de la presentación de nombres de productos.

Resultado:

* Los nombres se muestran con formato legible.
* Se verificó visualmente la normalización esperada.

Evidencia: captura de pantalla de la interfaz.

Resultado: **PASS**.

---

## 4.14. Evidencia TC-UX-02

Se realizó una búsqueda manual utilizando una palabra con error de escritura.

Resultado:

* El sistema permitió recuperar resultados asociados a la intención de búsqueda.
* Se verificó visualmente el comportamiento.

Evidencia: captura de la búsqueda y resultados obtenidos.

Resultado: **PASS**.

---

# 5. Defectos encontrados y correcciones

## DEF-MAPS-01 — El endpoint permitía radios superiores al máximo permitido

| Campo                 | Detalle                                                                           |
| --------------------- | --------------------------------------------------------------------------------- |
| ID                    | `DEF-MAPS-01`                                                                     |
| Severidad             | Media                                                                             |
| Funcionalidad         | Búsqueda de sucursales cercanas                                                   |
| Endpoint              | `GET /api/maps/sucursales-cercanas`                                               |
| Pasos para reproducir | Enviar `radio=999999`                                                             |
| Resultado esperado    | Rechazar el valor por superar el máximo permitido                                 |
| Resultado obtenido    | HTTP `200` y 27 sucursales                                                        |
| Impacto               | La API aceptaba un valor fuera de las reglas de negocio definidas por la interfaz |
| Corrección            | Se agregó validación `.min(1).max(10)` al schema                                  |
| Re-test               | `radio=999999`                                                                    |
| Resultado del re-test | HTTP `400`                                                                        |
| Estado                | ✅ CORREGIDO                                                                       |

---

---

## 3.7. Geobloqueo y funcionamiento offline

### TC-GEO-01 — API permitida para Argentina

| Campo              | Detalle                                                        |
| ------------------ | -------------------------------------------------------------- |
| ID                 | `TC-GEO-01`                                                    |
| Endpoint           | `GET /api/productos?sucursales_ids=9-1-153`                    |
| Tipo               | Geobloqueo / caso permitido                                   |
| Entrada            | Header `x-vercel-ip-country: AR`                              |
| Resultado esperado | HTTP `200` y respuesta normal de productos                     |
| Resultado obtenido | HTTP `200`, productos y precios devueltos correctamente        |
| Estado             | ✅ PASS                                                        |
| Herramienta        | Terminal                                                       |

### TC-GEO-02 — API bloqueada para país externo

| Campo              | Detalle                                                        |
| ------------------ | -------------------------------------------------------------- |
| ID                 | `TC-GEO-02`                                                    |
| Endpoint           | `GET /api/productos?sucursales_ids=9-1-153`                    |
| Tipo               | Geobloqueo / caso bloqueado                                   |
| Entrada            | Header `x-vercel-ip-country: US`                              |
| Resultado esperado | HTTP `403` con error `REGION_NOT_SUPPORTED`                   |
| Resultado obtenido | HTTP `403` con el error esperado                               |
| Estado             | ✅ PASS                                                        |
| Herramienta        | Terminal                                                       |

### TC-GEO-03 — API bloqueada cuando el país no está informado

| Campo              | Detalle                                                        |
| ------------------ | -------------------------------------------------------------- |
| ID                 | `TC-GEO-03`                                                    |
| Endpoint           | `GET /api/productos?sucursales_ids=9-1-153`                    |
| Tipo               | Geobloqueo / país desconocido                                 |
| Entrada            | Sin header `x-vercel-ip-country`                              |
| Resultado esperado | HTTP `403` con error `REGION_NOT_SUPPORTED`                   |
| Resultado obtenido | HTTP `403` con el error esperado                               |
| Estado             | ✅ PASS                                                        |
| Herramienta        | Terminal                                                       |

### TC-GEO-04 — Bloqueo de navegación fuera de Argentina

| Campo              | Detalle                                                        |
| ------------------ | -------------------------------------------------------------- |
| ID                 | `TC-GEO-04`                                                    |
| Ruta               | `/mi-lista`                                                    |
| Tipo               | Geobloqueo / navegación                                        |
| Entorno            | Producción local con `npm run start`                          |
| Entrada            | País no informado o distinto de `AR`                          |
| Resultado esperado | Mostrar pantalla `/acceso-restringido`                        |
| Resultado obtenido | Se mostró la pantalla de disponibilidad regional               |
| Estado             | ✅ PASS                                                        |
| Herramienta        | Navegador                                                      |

### TC-GEO-05 — Conservación de la lista offline

| Campo              | Detalle                                                        |
| ------------------ | -------------------------------------------------------------- |
| ID                 | `TC-GEO-05`                                                    |
| Tipo               | Offline / persistencia local                                   |
| Precondición       | Lista creada previamente con conexión                          |
| Acción             | Desactivar la red desde DevTools                              |
| Resultado esperado | La lista guardada continúa visible                             |
| Resultado obtenido | La lista continuó visible                                      |
| Estado             | ✅ PASS                                                        |
| Herramienta        | Navegador                                                      |

### TC-GEO-06 — Advertencia de conexión offline

| Campo              | Detalle                                                        |
| ------------------ | -------------------------------------------------------------- |
| ID                 | `TC-GEO-06`                                                    |
| Tipo               | Offline / interfaz                                             |
| Acción             | Desactivar la red con una fecha de conexión registrada         |
| Resultado esperado | Mostrar banner offline y última conexión registrada            |
| Resultado obtenido | El banner mostró la advertencia y la fecha de última conexión   |
| Estado             | ✅ PASS                                                        |
| Herramienta        | Navegador                                                      |

### TC-GEO-07 — Limpieza de caché de API ante bloqueo

| Campo              | Detalle                                                        |
| ------------------ | -------------------------------------------------------------- |
| ID                 | `TC-GEO-07`                                                    |
| Tipo               | Service worker / limpieza de caché                             |
| Precondición       | Existencia de entradas en `Cache Storage > apis`               |
| Acción             | Ejecutar una solicitud que devuelve `403 REGION_NOT_SUPPORTED`  |
| Resultado esperado | El contenido de `apis` debe eliminarse                         |
| Resultado obtenido | La caché `apis` quedó vacía                                    |
| Estado             | ✅ PASS                                                        |
| Herramienta        | Navegador / DevTools                                           |

### TC-GEO-08 — Conservación de datos locales del usuario

| Campo              | Detalle                                                        |
| ------------------ | -------------------------------------------------------------- |
| ID                 | `TC-GEO-08`                                                    |
| Tipo               | Offline / integridad de datos                                  |
| Acción             | Ejecutar bloqueo regional y revisar `localStorage`             |
| Resultado esperado | Conservar la clave `lalista-storage`                           |
| Resultado obtenido | `lalista-storage` permaneció disponible                        |
| Estado             | ✅ PASS                                                        |
| Herramienta        | Navegador / DevTools                                           |

### TC-GEO-09 — Registro y control del service worker

| Campo              | Detalle                                                        |
| ------------------ | -------------------------------------------------------------- |
| ID                 | `TC-GEO-09`                                                    |
| Tipo               | Service worker / integración                                   |
| Acción             | Verificar registro y control de la página                       |
| Resultado esperado | Service worker registrado y página controlada                   |
| Resultado obtenido | Serwist registrado `/serwist/sw.js`; `navigator.serviceWorker.controller` devolvió `true` |
| Estado             | ✅ PASS                                                        |
| Herramienta        | Navegador / DevTools                                           |


# 6. Resumen de resultados

| Categoría     |  Casos | Resultado                    |
| ------------- | -----: | ---------------------------- |
| Productos     |      6 | ✅ 6 PASS                     |
| Mapas         |      3 | ✅ 3 PASS luego de corrección |
| Rate limiting |      1 | ✅ PASS                       |
| Sesiones      |      1 | ✅ PASS                       |
| Logging       |      1 | ✅ PASS                       |
| UX / interfaz |      2 | ✅ 2 PASS  
| Geobloqueo / offline | 9 | ✅ 9 PASS |                   |
| **Total**     | **23** | **✅ PASS** |                 |

### Resultado general

Las funcionalidades y escenarios ejecutados para MVP3 presentan resultado satisfactorio luego de las correcciones realizadas.

Se identificó un defecto relacionado con la validación del radio máximo de búsqueda. El defecto fue reproducido, documentado, corregido y sometido a re-test, obteniendo resultado satisfactorio.

Se validó el geobloqueo local mediante API y navegación, la limpieza de la caché `apis`, la conservación de `lalista-storage`, el funcionamiento offline de la lista y el registro del service worker.

La validación del Firewall de Vercel y la repetición de estas pruebas en producción quedan pendientes.

El proceso de testing permitió generar evidencia concreta del ciclo:

**Problema → prueba → defecto → corrección → re-test → evidencia.**

---

# 7. Funcionalidades pendientes de validación

Las siguientes funcionalidades forman parte de la estrategia de testing pero no se registran como PASS hasta contar con una ejecución y evidencia correspondiente:

* Confirmar en producción la regla de Firewall de Vercel.
* Repetir pruebas de API y navegación desde una ubicación fuera de Argentina.
* Validar nuevamente el flujo offline después de activar el Firewall.
* Persistencia histórica de logs para consulta y monitoreo.
* Validación de rate limiting en ambiente distribuido/serverless.
* Pruebas adicionales de autenticación/autorización en endpoints que lo requieran.

Estas funcionalidades se mantienen diferenciadas de los casos ejecutados para evitar declarar como probado un comportamiento que todavía no cuenta con evidencia.

---

# 8. Criterios de validación de APIs

Además del código HTTP esperado, cuando corresponde se valida:

* Estructura de la respuesta.
* Tipo de los campos principales.
* Presencia de campos obligatorios.
* Mensajes de error definidos por el contrato.
* Comportamiento ante inputs inválidos.
* Comportamiento ante recursos inexistentes.
* Cumplimiento de límites definidos por la aplicación.
* Cantidad y contenido de los resultados.
* Comportamiento ante casos extremos.

---

# 9. Herramientas utilizadas

* **Bruno:** ejecución de pruebas de API, assertions y registro de resultados.
* **Navegador:** pruebas manuales de interfaz y usabilidad.
* **Terminal:** ejecución local, observación de logs y verificación de comportamiento del backend.
* **Base de datos:** verificación de datos reales utilizados para construir escenarios reproducibles.

---

# 10. Criterio de cierre de testing MVP3

Se considera que una funcionalidad está validada cuando:

1. Existe un caso de prueba identificado.
2. Se define el resultado esperado.
3. Se ejecuta el escenario.
4. Se registra el resultado obtenido.
5. Se conserva evidencia cuando corresponde.
6. Si se detecta un defecto, se documenta.
7. Se aplica la corrección.
8. Se ejecuta un re-test.
9. El re-test confirma el comportamiento esperado.
