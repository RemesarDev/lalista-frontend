"""
Carga de promociones bancarias - Paso 5: Coto + Carrefour + Changomas + Cencosud (Jumbo, Disco, Vea) + La Anónima
Trae las promos de cada cadena, las traduce al formato de la tabla
promociones_bancarias y las guarda en LALIstaMensual (base de pruebas).

Necesita un archivo .env en la misma carpeta con:
SUPABASE_URL=...
SUPABASE_KEY=...   (clave secreta, NUNCA subirla a GitHub)
"""
import base64
import hashlib
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests

URL_COTO = (
    "https://www.coto.com.ar/rest/model/atg/actors/cProfileActor/"
    "getPromocionesMulticanal?enviroment=ag&pushSite=CotoDigital"
)

# Sin esto, Coto rechaza el pedido (error 403): hay que identificarse como navegador
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/128.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
}

# Nombres legibles para los logos que usa Coto
NOMBRES_ENTIDAD = {
    "naranjax": "Naranja X", "comafi": "Comafi", "comafi_unico": "Comafi Único", "supervielle": "Supervielle",
    "columbia": "Columbia", "credicoop": "Credicoop", "ciudad": "Banco Ciudad",
    "galicia": "Galicia", "macro_bma": "Macro", "nacion_d": "Banco Nación",
    "bbva": "BBVA", "mercadopago": "Mercado Pago", "tci": "Tarjeta TCI",
    "icbc": "ICBC", "amex": "American Express", "ciudadania_portena": "Ciudadanía Porteña",
    "beneficios_anses": "ANSES", "patagonia": "Patagonia", "comunidad": "Comunidad Coto",
    "modo": "MODO", "jubiladosypensionados": "Jubilados y Pensionados", "visa": "Visa",
}


def nombre_entidad(icono):
    # "logo_galicia.png" -> "galicia" ; "bbva2.png" -> "bbva"
    clave = icono.lower().replace(".png", "").replace("logo_", "")
    clave = re.sub(r"[_]?\d+$", "", clave)
    return NOMBRES_ENTIDAD.get(clave, clave)


def convertir_dia(id_coto):
    # Coto: 1 = domingo, 2 = lunes ... 7 = sábado
    # Nuestro formato: 1 = lunes ... 7 = domingo
    return 7 if id_coto == 1 else id_coto - 1


def leer_tope(texto):
    t = texto.lower()
    if "sin tope" in t or "sin límite" in t or "sin limite" in t:
        return None, None
    monto = re.search(r"tope[^$]*\$\s*([\d\.]+)", t)
    if not monto:
        return None, None
    tope = float(monto.group(1).replace(".", ""))
    if "por semana" in t:
        periodo = "semana"
    elif "por mes" in t:
        periodo = "mes"
    elif re.search(r"por d[ií]a", t):
        periodo = "dia"
    else:
        periodo = "compra"
    return tope, periodo


def tipo_tarjeta(texto):
    t = texto.lower()
    credito = "crédito" in t or "credito" in t
    debito = "débito" in t or "debito" in t
    if credito and not debito:
        return "credito"
    if debito and not credito:
        return "debito"
    return "cualquiera"


def traducir_coto(p):
    texto = (p.get("textoDescuento") or "").upper()
    condiciones = f"{p.get('descripcion') or ''} {p.get('observacion') or ''}".strip()

    cuotas = porcentaje = None
    if "CUOTAS" in texto:
        tipo = "cuotas"
        n = re.search(r"(\d+)", texto)
        cuotas = int(n.group(1)) if n else None
    else:
        tipo = "descuento"
        n = re.search(r"(\d+)\s*(%|OFF)", texto)
        porcentaje = float(n.group(1)) if n else None

    dias = [convertir_dia(d["id"]) for d in p.get("dias") or []]
    if not dias:
        dias = [1, 2, 3, 4, 5, 6, 7]  # Coto no indica día: la tomamos como todos los días

    tope, tope_periodo = leer_tope(condiciones)

    return {
        "id_comercio": 12,
        "id_bandera": 1,
        "cadena": "Coto",
        "entidad": nombre_entidad(p.get("icono") or ""),
        "tipo_promo": tipo,
        "dias": sorted(set(dias)),
        "porcentaje": porcentaje,
        "cuotas": cuotas,
        "tope": tope,
        "tope_periodo": tope_periodo,
        "tipo_tarjeta": tipo_tarjeta(p.get("descripcion") or ""),
        "canal": "online" if p.get("isDigital") else "presencial",
        "vigencia_desde": None,
        "vigencia_hasta": None,
        "condiciones": condiciones,
        "fuente": "api_coto",
        "id_origen": str(p.get("id")),
    }


def traer_coto():
    respuesta = requests.get(URL_COTO, headers=HEADERS, timeout=30)
    respuesta.raise_for_status()
    datos = respuesta.json()["result"]
    crudas = datos["promocionesDigitales"] + datos["promocionesSucursalesFisicas"]
    return [traducir_coto(p) for p in crudas]


# ---------------------------------------------------------------------------
# Carrefour y Changomas (misma API, hecha por Valtech sobre VTEX)
# ---------------------------------------------------------------------------

VALTECH = {
    "carrefour": {
        "base": "https://www.carrefour.com.ar",
        "operacion": "GetPromotions",
        "hash": "e3aa1d96402d80dbca5c2c9dbcb7ff859970db0ccfdb64e583fb8a9b1bbff49e",
        "sender": "valtech.carrefourar-bank-promotions@0.x",
        "account": "carrefourar",
    },
    "changomas": {
        "base": "https://www.masonline.com.ar",
        "operacion": "GetPromos",
        "hash": "1a071ebc5dc407a3f65e687b0f4c0a3b8d12a0c45d8d11370075c3b2a505251c",
        "sender": "valtech.gdn-banks-promotions@0.x",
        "account": "masonlineprod",
    },
}

DIAS_SEMANA = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

# Palabras que buscamos en el nombre del logo y en el título para saber de qué
# banco o billetera es la promo. El orden importa: lo más específico va primero.
PALABRAS_ENTIDAD = [
    ("cuenta dni", "Cuenta DNI"), ("cuenta_dni", "Cuenta DNI"),
    ("bcoprov", "Banco Provincia"), ("club_lanacion", "Club La Nación"),
    ("club la nacion", "Club La Nación"), ("cuenta-digital", "Cuenta Digital Carrefour"),
    ("cuentadigital", "Cuenta Digital Carrefour"), ("cuenta digital", "Cuenta Digital Carrefour"),
    ("carrefour-credito", "Tarjeta Carrefour"), ("tarjeta de crédito carrefour", "Tarjeta Carrefour"),
    ("tarjeta de crédito de carrefour", "Tarjeta Carrefour"), ("micrf", "Mi Carrefour"),
    ("carrefour-banco", "Todos los medios de pago"), ("santander", "Santander"),
    ("galicia", "Galicia"), ("credicoop", "Credicoop"), ("icbc", "ICBC"),
    ("patagonia", "Patagonia"), ("hipotecario", "Hipotecario"), ("comafi", "Comafi"),
    ("columbia", "Columbia"), ("supervielle", "Supervielle"), ("naranja", "Naranja X"),
    ("modobna", "Banco Nación"), ("buepp", "Banco Ciudad"), ("ciudad", "Banco Ciudad"),
    ("credicuotas", "Credicuotas"), ("banco sol", "Banco Sol"), ("tuya", "Tuya"),
    ("bancor", "Bancor"), ("yoy", "YOY"), ("anses", "ANSES"), ("empleado", "Empleados públicos"),
    ("masclub", "MasClub"), ("billeteras", "Billeteras virtuales"),
    ("cencopay", "CencoPay"), ("visa y master", "Visa y Mastercard"),
    ("medios de pago", "Todos los medios de pago"), ("clarin", "Clarín 365"),
    ("club rio negro", "Club Río Negro"), ("marco juarez", "Tarjeta Marcos Juárez"),
    ("la voz", "Club La Voz"), ("gaceta", "Club La Gaceta"), ("la capital", "Club La Capital"),
    ("andes pass", "Andes Pass"), ("tarjeta sol", "Tarjeta Sol"),
    ("nacion", "Banco Nación"),
    ("mercado", "Mercado Pago"), ("modo", "MODO"), ("credito.png", "Tarjeta Carrefour"),
]

# Bancos de otras provincias: la app solo cubre zona oeste de Buenos Aires
ENTIDADES_REGIONALES = {
    "Bancor", "Club Río Negro", "Tarjeta Marcos Juárez", "Club La Voz", "Club La Gaceta",
    "Club La Capital", "Andes Pass",
}


def valor(texto):
    """La API devuelve todo como texto, incluso 'null', 'true' y 'false'."""
    if texto in (None, "null", ""):
        return None
    if texto == "true":
        return True
    if texto == "false":
        return False
    return texto


def entidad_valtech(c):
    texto = f"{c.get('img_card') or ''} {c.get('title') or ''} {c.get('sub_title') or ''}".lower()
    for palabra, nombre in PALABRAS_ENTIDAD:
        if palabra in texto:
            return nombre
    # Si no la reconocemos, usamos el nombre del logo para poder revisarlo después
    return re.sub(r"\.(png|webp|jpg)$", "", (c.get("img_card") or "desconocido").lower())


def fecha(texto):
    return texto[:10] if texto else None


def bandera_y_canal(nombre, c):
    """Devuelve una lista de (id_comercio, id_bandera, canal) donde vale la promo."""
    online = bool(c.get("ecommerce"))
    if nombre == "carrefour":
        # Banderas de Carrefour que hay en la base: Hiper (1), Express (3), Maxi (4)
        fisicas = [b for formato, b in (("hyper", 1), ("express", 3), ("maxi", 4)) if c.get(formato)]
        if fisicas:
            canal = "ambos" if online else "presencial"
            return [(10, b, canal) for b in fisicas]
        return [(10, 1, "online")] if online else []
    # Changomas: "hyper" = Hiper Changomas, "express" = Changomas y "market" = MasGo.
    # Los tres son tiendas físicas. Solo "ecommerce" es online.
    presencial = bool(c.get("hyper") or c.get("express") or c.get("market"))
    if presencial and online:
        return [(11, 2, "ambos")]
    if presencial:
        return [(11, 2, "presencial")]
    if online:
        return [(11, 2, "online")]
    return []


def traducir_valtech(nombre, cadena, campos):
    c = {k: valor(v) for k, v in campos.items()}
    entidad = entidad_valtech(c)
    if entidad in ENTIDADES_REGIONALES:
        return []

    texto_titulo = f"{c.get('title') or ''} {c.get('sub_title') or ''}"
    condiciones = f"{texto_titulo} {c.get('legal') or ''}".strip()

    porcentaje = float(c["discount_percentage"]) if c.get("discount_percentage") else None
    cuotas = int(c["discounts_amount_installments"]) if c.get("discounts_amount_installments") else None
    tipo = "descuento" if porcentaje else "cuotas"

    dias = [i + 1 for i, d in enumerate(DIAS_SEMANA) if c.get(d)]
    if not dias:
        dias = [1, 2, 3, 4, 5, 6, 7]

    if "sin tope" in texto_titulo.lower():
        tope, tope_periodo = None, None
    else:
        tope, tope_periodo = leer_tope(condiciones)

    filas = []
    for id_comercio, id_bandera, canal in bandera_y_canal(nombre, c):
        filas.append({
            "id_comercio": id_comercio,
            "id_bandera": id_bandera,
            "cadena": cadena,
            "entidad": entidad,
            "tipo_promo": tipo,
            "dias": dias,
            "porcentaje": porcentaje,
            "cuotas": cuotas,
            "tope": tope,
            "tope_periodo": tope_periodo,
            "tipo_tarjeta": tipo_tarjeta(texto_titulo),
            "canal": canal,
            "vigencia_desde": fecha(c.get("active_from")),
            "vigencia_hasta": fecha(c.get("active_to")),
            "condiciones": condiciones,
            "fuente": f"api_{nombre}",
            "id_origen": str(c.get("id")),
        })
    return filas


def traer_valtech(nombre, cadena):
    cfg = VALTECH[nombre]
    ahora = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    filtro = {
        "where": f"active=true AND ((active_from < {ahora}) AND (active_to > {ahora}))",
        "account": cfg["account"],
    }
    extensiones = {
        "persistedQuery": {
            "version": 1,
            "sha256Hash": cfg["hash"],
            "sender": cfg["sender"],
            "provider": "vtex.store-graphql@2.x",
        },
        "variables": base64.b64encode(json.dumps(filtro).encode()).decode(),
    }
    params = {
        "workspace": "master", "maxAge": "short", "appsEtag": "remove",
        "domain": "store", "locale": "es-AR", "operationName": cfg["operacion"],
        "variables": "{}", "extensions": json.dumps(extensiones),
    }
    respuesta = requests.get(f"{cfg['base']}/_v/public/graphql/v1", params=params,
                             headers=HEADERS, timeout=30)
    respuesta.raise_for_status()
    documentos = list(respuesta.json()["data"].values())[0]
    filas = []
    for doc in documentos:
        campos = {f["key"]: f["value"] for f in doc["fields"]}
        filas.extend(traducir_valtech(nombre, cadena, campos))
    return filas


# ---------------------------------------------------------------------------
# Cencosud: Jumbo, Disco y Vea (una sola API para las tres)
# ---------------------------------------------------------------------------

URL_CENCOSUD = (
    "https://www.jumbo.com.ar/api/dataentities/JN/documents/bankDiscount"
    "?_fields=value,id&an=jumboargentina"
)

# Sitio web de Cencosud -> (id_comercio, id_bandera, nombre) en la base
BANDERAS_CENCOSUD = {
    "veaargentina": (9, 1, "Vea"),
    "discoargentina": (9, 2, "Disco"),
    "jumboargentina": (9, 3, "Jumbo"),
    "jumboargentinaio": (9, 3, "Jumbo"),
}


def canal_por_texto(texto):
    t = texto.lower()
    presencial = "presencial" in t or "local" in t or "sucursal" in t
    online = any(p in t for p in ("online", "web", ".com.ar", "sitio", "telefónica"))
    if "exclusivo presencial" in t or (presencial and not online):
        return "presencial"
    if online and not presencial:
        return "online"
    return "ambos"


def traducir_cencosud(p):
    # Promos de sucursales puntuales (en general de otras provincias): afuera
    if p.get("stores"):
        return []

    nombres_banco = " ".join((b.get("name") or "").strip() for b in p.get("banks") or [])
    entidad = None
    for palabra, nombre in PALABRAS_ENTIDAD:
        if palabra in nombres_banco.lower():
            entidad = nombre
            break
    entidad = entidad or nombres_banco or "desconocido"
    if entidad in ENTIDADES_REGIONALES:
        return []

    texto_descuento = (p.get("discountText") or "").lower()
    if "mil" in texto_descuento:
        return []  # descuento de monto fijo ($), no es porcentaje ni cuotas
    numero = float(p["discount"]) if p.get("discount") else None
    if "cuota" in texto_descuento or "csi" in texto_descuento:
        tipo, porcentaje, cuotas = "cuotas", None, int(numero) if numero else None
    else:
        tipo, porcentaje, cuotas = "descuento", numero, None

    info = (p.get("info") or "").replace("\r\n", " ")

    # Cencosud: 1 = lunes ... 6 = sábado. El domingo casi nunca viene en la lista,
    # así que lo agregamos si el texto lo menciona.
    dias = {7 if d in ("0", "7") else int(d) for d in p.get("days") or []}
    texto_dias = f"{info} {p.get('legals') or ''}".lower()
    if "domingo" in texto_dias or "todos los días" in texto_dias or "todos los dias" in texto_dias:
        dias.add(7)
    dias = sorted(dias) or [1, 2, 3, 4, 5, 6, 7]
    condiciones = f"{info} {p.get('legals') or ''}".strip()
    if "sin tope" in info.lower():
        tope, tope_periodo = None, None
    else:
        tope, tope_periodo = leer_tope(condiciones)

    medios = set((p.get("paymentMethod") or {}).keys())
    if medios == {"Crédito"}:
        tarjeta = "credito"
    elif medios == {"Débito"}:
        tarjeta = "debito"
    else:
        tarjeta = "cualquiera"

    desde = datetime.fromtimestamp(float(p["dateStart"]), timezone.utc).strftime("%Y-%m-%d")
    hasta = datetime.fromtimestamp(float(p["dateEnd"]), timezone.utc).strftime("%Y-%m-%d")

    # La API no trae un id por promo: armamos uno a partir de su contenido
    huella = json.dumps([
        nombres_banco, p.get("discount"), p.get("discountText"), p.get("days"),
        p.get("dateStart"), p.get("dateEnd"), info, p.get("legals"),
    ])
    id_origen = hashlib.md5(huella.encode()).hexdigest()[:16]

    banderas = {BANDERAS_CENCOSUD[w] for w in p.get("websites") or [] if w in BANDERAS_CENCOSUD}
    return [{
        "id_comercio": id_comercio,
        "id_bandera": id_bandera,
        "cadena": cadena,
        "entidad": entidad,
        "tipo_promo": tipo,
        "dias": dias,
        "porcentaje": porcentaje,
        "cuotas": cuotas,
        "tope": tope,
        "tope_periodo": tope_periodo,
        "tipo_tarjeta": tarjeta,
        "canal": canal_por_texto(info),
        "vigencia_desde": desde,
        "vigencia_hasta": hasta,
        "condiciones": condiciones,
        "fuente": "api_cencosud",
        "id_origen": id_origen,
    } for id_comercio, id_bandera, cadena in sorted(banderas)]


def traer_cencosud():
    respuesta = requests.get(URL_CENCOSUD, headers=HEADERS, timeout=30)
    respuesta.raise_for_status()
    datos = respuesta.json()
    if isinstance(datos, list):  # a veces la API devuelve una lista
        datos = datos[0]
    todas = json.loads(datos["value"])

    # La API guarda también promos vencidas: nos quedamos con las vigentes hoy
    ahora = datetime.now(timezone.utc).timestamp()
    vigentes = [
        p for p in todas
        if p.get("dateStart") and p.get("dateEnd")
        and float(p["dateStart"]) <= ahora <= float(p["dateEnd"])
    ]
    filas = []
    vistas = set()
    for p in vigentes:
        for fila in traducir_cencosud(p):
            # Si la API repite una promo idéntica, la guardamos una sola vez
            clave = (fila["id_origen"], fila["id_bandera"])
            if clave in vistas:
                continue
            vistas.add(clave)
            filas.append(fila)
    return filas


# ---------------------------------------------------------------------------
# La Anónima (no tiene API: leemos el HTML de la página)
# ---------------------------------------------------------------------------

URL_ANONIMA = "https://www.laanonima.com.ar/empresa/promociones-y-descuentos"

# Nombres más claros para los bancos que usa La Anónima
NOMBRES_ANONIMA = {
    "Banco DNI": "Cuenta DNI", "Banco MODO": "MODO", "Banco Mercado Pago": "Mercado Pago",
    "Banco Mastercard": "Mastercard", "Banco Cabal": "Cabal", "Banco Galicia": "Galicia",
    "Banco ICBC": "ICBC", "Banco Patagonia": "Patagonia", "Banco Hipotecario": "Hipotecario",
    "Banco Columbia": "Columbia", "Tarjeta Naranja X": "Naranja X",
}

# Bancos de otras provincias
REGIONALES_ANONIMA = {
    "Banco Cordoba", "Banco Santa Cruz", "Banco Santa Fe", "Banco del Chaco",
    "Banco Tierra del Fuego", "Banco San Juan + MODO", "Banco Patagonia 365",
}


def solo_otra_provincia(texto):
    """True si el texto dice que la promo vale solo en una provincia que no es Buenos Aires."""
    t = texto.lower()
    m = re.search(r"(?:s[oó]lo|únicamente|exclusivamente)[^.]*?provincia de ([a-záéíóúñ ]+)", t)
    if not m:
        return False
    provincia = m.group(1).strip()
    return not (provincia.startswith("buenos aires") or provincia.startswith("bsas"))


def limpiar(texto):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", texto))).strip()


def traer_anonima():
    headers = {**HEADERS, "Accept": "text/html"}
    respuesta = requests.get(URL_ANONIMA, headers=headers, timeout=30)
    respuesta.raise_for_status()
    pagina = respuesta.text

    # Lista de bancos: número -> nombre
    bancos = {}
    for m in re.finditer(r'banco-card" data-id="(\d+)">(.*?)</div>\s*</div>', pagina, re.S):
        alt = re.search(r'alt="([^"]*)"', m.group(2))
        bancos[m.group(1)] = alt.group(1).strip() if alt else ""

    tarjetas = re.finditer(
        r'class="promo-card"[^>]*data-day="([^"]*)" data-bank="([^"]*)">(.*?)'
        r'promo-card-legal">\s*<p[^>]*>(.*?)</p>',
        pagina, re.S,
    )

    filas = []
    vistas = set()
    for m in tarjetas:
        dias_txt, bancos_txt, cuerpo, legal_html = m.groups()
        ids_banco = [b for b in bancos_txt.strip("|").split("|") if b]
        if not ids_banco:
            continue  # promos que no son bancarias (ej: "Promo Colgate")

        titulo_m = re.search(r"<strong>(.*?)</strong>", cuerpo, re.S)
        titulo = limpiar(titulo_m.group(1)) if titulo_m else ""
        legal = limpiar(legal_html)

        # Si hay varios bancos (ej: Hipotecario + MODO), nos quedamos con el que no es MODO
        nombres = [bancos.get(b, b) for b in ids_banco]
        principal = next((n for n in nombres if n != "Banco MODO"), nombres[0])
        if principal in REGIONALES_ANONIMA or solo_otra_provincia(legal):
            continue
        entidad = NOMBRES_ANONIMA.get(principal, principal)

        # La página repite cada promo (versión celular y compu): la guardamos una vez
        id_origen = hashlib.md5(f"{titulo}|{legal}|{dias_txt}|{bancos_txt}".encode()).hexdigest()[:16]
        if id_origen in vistas:
            continue
        vistas.add(id_origen)

        texto = f"{titulo} {legal}"
        cuotas_m = re.search(r"(\d+)\s*cuotas", texto, re.I)
        porcentaje_m = re.search(r"(\d+)\s*%", titulo) or re.search(r"(\d+)\s*%", legal)
        porcentaje = float(porcentaje_m.group(1)) if porcentaje_m else None
        cuotas = int(cuotas_m.group(1)) if cuotas_m else None
        if not porcentaje and not cuotas:
            continue
        tipo = "descuento" if porcentaje else "cuotas"

        # La Anónima: 1 = lunes ... 7 = domingo
        dias = sorted({int(d) for d in dias_txt.strip("|").split("|") if d}) or [1, 2, 3, 4, 5, 6, 7]

        fechas = re.findall(r"(\d{2})/(\d{2})/(\d{4})", legal)
        # Con dos fechas: desde y hasta. Con una sola, casi siempre es "válido hasta".
        a_iso = lambda f: f"{f[2]}-{f[1]}-{f[0]}"
        desde = a_iso(fechas[0]) if len(fechas) > 1 else None
        hasta = a_iso(fechas[-1]) if fechas else None

        if "sin tope" in texto.lower():
            tope, tope_periodo = None, None
        else:
            tope, tope_periodo = leer_tope(legal)

        filas.append({
            "id_comercio": 2,
            "id_bandera": 1,
            "cadena": "La Anónima",
            "entidad": entidad,
            "tipo_promo": tipo,
            "dias": dias,
            "porcentaje": porcentaje,
            "cuotas": cuotas,
            "tope": tope,
            "tope_periodo": tope_periodo,
            "tipo_tarjeta": tipo_tarjeta(texto),
            "canal": canal_por_texto(legal),
            "vigencia_desde": desde,
            "vigencia_hasta": hasta,
            "condiciones": texto,
            "fuente": "html_anonima",
            "id_origen": id_origen,
        })
    return filas


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------

def leer_env():
    ruta = Path(__file__).parent / ".env"
    config = {}
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if linea and not linea.startswith("#") and "=" in linea:
            clave, valor = linea.split("=", 1)
            config[clave.strip()] = valor.strip()
    return config


def headers_supabase(clave):
    h = {"apikey": clave, "Content-Type": "application/json"}
    # Las claves viejas (service_role) son tokens que empiezan con "eyJ"
    # y además van en Authorization. Las nuevas (sb_secret_...) no.
    if clave.startswith("eyJ"):
        h["Authorization"] = f"Bearer {clave}"
    return h


def guardar_en_supabase(promos, fuente):
    """Borra las promos viejas de esta fuente y guarda las de hoy."""
    config = leer_env()
    url = f"{config['SUPABASE_URL']}/rest/v1/promociones_bancarias"
    h = headers_supabase(config["SUPABASE_KEY"])

    # 1. Borrar lo que se cargó antes desde esta fuente
    r = requests.delete(url, headers=h, params={"fuente": f"eq.{fuente}"}, timeout=30)
    if not r.ok:
        raise RuntimeError(f"Error al borrar ({r.status_code}): {r.text}")

    # 2. Insertar las promos de hoy
    r = requests.post(url, headers={**h, "Prefer": "return=minimal"}, json=promos, timeout=30)
    if not r.ok:
        raise RuntimeError(f"Error al guardar ({r.status_code}): {r.text}")


def mostrar(promos):
    for p in promos:
        valor = f"{p['porcentaje']:.0f}%" if p["tipo_promo"] == "descuento" else f"{p['cuotas']} cuotas"
        tope = f"tope ${p['tope']:,.0f} por {p['tope_periodo']}" if p["tope"] else "sin tope"
        print(f"{p['entidad']:<25} {valor:<10} días {p['dias']}  {p['canal']:<10} {tope}")


FUENTES = [
    ("Coto", "api_coto", traer_coto),
    ("Carrefour", "api_carrefour", lambda: traer_valtech("carrefour", "Carrefour")),
    ("Changomas", "api_changomas", lambda: traer_valtech("changomas", "Changomas")),
    ("Jumbo, Disco y Vea", "api_cencosud", traer_cencosud),
    ("La Anónima", "html_anonima", traer_anonima),
]


if __name__ == "__main__":
    for cadena, fuente, traer in FUENTES:
        # Si una cadena falla, seguimos con las demás
        try:
            promos = traer()
            guardar_en_supabase(promos, fuente)
            print(f"{cadena}: {len(promos)} promos guardadas")
        except Exception as error:
            print(f"{cadena}: ERROR -> {error}")