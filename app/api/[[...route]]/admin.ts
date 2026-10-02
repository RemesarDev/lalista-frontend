// app/api/[[...route]]/admin.ts
import { Hono, Context, Next } from 'hono';
import { auth } from '@/app/_lib/auth';
import { zValidator } from '@hono/zod-validator';
import { adminMetricsQuerySchema } from '@/app/_lib/apiSchemas';
import { supabase, supabaseAnalytics } from '@/app/_lib/supabase';

// 1. Middleware de Autenticación y Autorización para Admin
const adminGuard = async (c: Context, next: Next) => {
    try {
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (!session || session.user.role !== 'admin') {
            return c.json(
                { success: false, error: 'Acceso denegado: Se requieren privilegios de administrador' },
                403
            );
        }

        // Inyectamos el usuario administrador en el contexto por si se necesita
        c.set('adminUser', session.user);
        await next();
    } catch (error) {
        return c.json({ success: false, error: 'Error interno de validación en servidor' }, 500);
    }
};

// 2. Definición del Router de Admin
export const adminRouter = new Hono()
    .use('/admin/*', adminGuard)
    .get(
        '/admin/metrics',
        zValidator('query', adminMetricsQuerySchema),
        async (c) => {
            const { metricName, search, field, startDate, endDate, page, limit } = c.req.valid('query');

            try {
                // Iniciamos la consulta a la tabla analytics_events de la Base 2
                let query = supabaseAnalytics
                .from('analytics_events')
                .select('*', { count: 'exact' });

                // 1. Filtro por tipo de métrica / event_name (ej: 'page_view')
                if (metricName) {
                    query = query.eq('event_name', metricName);
                }

                // 2. Filtro de búsqueda dinámica
                if (search && search.trim() !== '') {
                    if (field === 'region') {
                        query = query.ilike('region', `%${search}%`);
                    } else if (field === 'user_id') {
                        query = query.eq('user_id', search);
                    } else if (field === 'path') {
                        // Buscamos dentro del JSONB metadata->>path
                        query = query.ilike('metadata->>path', `%${search}%`);
                    } else {
                        // Búsqueda general por aproximación en event_name o region
                        query = query.or(`event_name.ilike.%${search}%,region.ilike.%${search}%`);
                    }
                }
                // 3. Filtro por rango de fechas (startDate y endDate)
                if (startDate) {
                    query = query.gte('created_at', `${startDate}T00:00:00Z`);
                }
                if (endDate) {
                    query = query.lte('created_at', `${endDate}T23:59:59Z`);
                }

                // 3. Paginación y orden (lo más reciente primero)
                const from = (page - 1) * limit;
                const to = from + limit - 1;

                query = query
                    .order('created_at', { ascending: false })
                    .range(from, to);

                const { data, count, error } = await query;

                if (error) {
                    console.error('[ADMIN METRICS ERROR - DETALLE]:', error);
                    return c.json({ 
                        success: false, 
                        error: `Error Base 2 (Analíticas): ${error.message} (Code: ${error.code})` 
                    }, 500);
                }

                return c.json({
                    success: true,
                    data: data || [],
                    pagination: {
                        page,
                        limit,
                        totalItems: count || 0,
                        totalPages: count ? Math.ceil(count / limit) : 0,
                    },
                });

            } catch (err) {
                console.error('[ADMIN METRICS EXCEPTION]', err);
                return c.json({ success: false, error: 'Error interno del servidor al procesar métricas' }, 500);
            }
        }
    
    )
    .get(
        '/admin/metrics/ranking-productos',
        async (c) => {
            try {
                // 1. Extraer los parámetros de filtro de la URL
                const startDate = c.req.query('startDate');
                const endDate = c.req.query('endDate');
                const region = c.req.query('region');
                const province = c.req.query('province');
                const city = c.req.query('city');
                const dayOfWeek = c.req.query('dayOfWeek'); // '0' a '6'
                const limit = parseInt(c.req.query('limit') || '15', 10);

                // 2. Ejecutar la función RPC en la Base de Datos 2 (Analíticas)
                const { data: rankingData, error: rpcError } = await supabaseAnalytics.rpc('get_top_compared_eans', {
                    p_start_date: startDate ? `${startDate}T00:00:00Z` : null,
                    p_end_date: endDate ? `${endDate}T23:59:59Z` : null,
                    p_region: region || null,
                    p_province: province || null,
                    p_city: city || null,
                    p_day_of_week: dayOfWeek !== undefined && dayOfWeek !== '' ? parseInt(dayOfWeek, 10) : null,
                    p_limit: limit,
                });

                if (rpcError) {
                    console.error('[RANKING RPC ERROR]', rpcError);
                    return c.json({ success: false, error: 'Error al obtener el ranking de analíticas' }, 500);
                }

                if (!rankingData || rankingData.length === 0) {
                    return c.json({
                        success: true,
                        filters: { startDate, endDate, region, province, city, dayOfWeek },
                        ranking: []
                    });
                }

                // 3. Extraer los EANs que devuelve la Base 2
                const eans = rankingData.map((item: any) => item.ean);

                // 4. Consultar la Base 1 usando el esquema real de tu tabla "productos"
                const { data: productosData, error: prodError } = await supabase
                    .from('productos')
                    .select('id_producto, productos_descripcion, productos_marca')
                    .in('id_producto', eans);

                if (prodError) {
                    console.error('[PRODUCTS FETCH ERROR - DETALLE]:', prodError);
                    return c.json({ 
                        success: false, 
                        error: `Error Base 1: ${prodError.message} (Code: ${prodError.code})` 
                    }, 500);
                }

                // Crear un mapa temporal usando id_producto para un rápido acceso
                const productoMap = new Map();
                productosData?.forEach((p: any) => {
                    productoMap.set(p.id_producto, { 
                        nombre: p.productos_descripcion, 
                        marca: p.productos_marca 
                    });
                });

                // 5. Unir los resultados del conteo (Base 2) con el catálogo real (Base 1)
                const enrichedRanking = rankingData.map((item: any) => {
                    const prodInfo = productoMap.get(item.ean) || { 
                        nombre: 'Producto no encontrado en catálogo', 
                        marca: 'Desconocida' 
                    };
                    return {
                        ean: item.ean,
                        productName: prodInfo.nombre,
                        brand: prodInfo.marca?.trim() || 'Sin marca',
                        comparisonCount: Number(item.comparison_count),
                    };
                });

                return c.json({
                    success: true,
                    filters: {
                        startDate: startDate || 'Histórico completo',
                        endDate: endDate || 'Actualidad',
                        region: region || 'Todas',
                        province: province || 'Todas',
                        city: city || 'Todas',
                        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : 'Todos',
                    },
                    ranking: enrichedRanking,
                });

            } catch (err) {
                console.error('[ADMIN RANKING EXCEPTION]', err);
                return c.json({ success: false, error: 'Error interno del servidor al procesar el ranking' }, 500);
            }
        }
    )
    .get(
        '/admin/metrics/ranking-producto-busqueda',
        async (c) => {
            try {
                const keyword = c.req.query('keyword');
                const startDate = c.req.query('startDate');
                const endDate = c.req.query('endDate');
                const region = c.req.query('region');
                const province = c.req.query('province');
                const city = c.req.query('city');
                const dayOfWeek = c.req.query('dayOfWeek');
                const limit = parseInt(c.req.query('limit') || '15', 10);

                if (!keyword || keyword.trim() === '') {
                    return c.json({ 
                        success: false, 
                        error: 'Se requiere una palabra clave para realizar la búsqueda analítica' 
                    }, 400);
                }

                // 1. Buscar en la Base 1 los productos que coinciden con la palabra clave
                const { data: matchedProds, error: searchError } = await supabase
                    .from('productos')
                    .select('id_producto, productos_descripcion, productos_marca')
                    .ilike('productos_descripcion', `%${keyword.trim()}%`);

                if (searchError) {
                    console.error('[BUSQUEDA PROD ERROR]', searchError);
                    return c.json({ success: false, error: 'Error al buscar productos en la Base 1' }, 500);
                }

                if (!matchedProds || matchedProds.length === 0) {
                    return c.json({
                        success: true,
                        keyword: keyword.trim(),
                        ranking: []
                    });
                }

                const targetEans = matchedProds.map((p: any) => p.id_producto);
                const productoMap = new Map();
                matchedProds.forEach((p: any) => {
                    productoMap.set(p.id_producto, { 
                        nombre: p.productos_descripcion, 
                        marca: p.productos_marca 
                    });
                });

                // 2. Traer el ranking general de la Base 2 y filtrar solo los EANs coincidentes
                const { data: rankingData, error: rpcError } = await supabaseAnalytics.rpc('get_top_compared_eans', {
                    p_start_date: startDate ? `${startDate}T00:00:00Z` : null,
                    p_end_date: endDate ? `${endDate}T23:59:59Z` : null,
                    p_region: region || null,
                    p_province: province || null,
                    p_city: city || null,
                    p_day_of_week: dayOfWeek !== undefined && dayOfWeek !== '' ? parseInt(dayOfWeek, 10) : null,
                    p_limit: 100,
                });

                if (rpcError) {
                    console.error('[RANKING RPC ERROR]', rpcError);
                    return c.json({ success: false, error: 'Error al consultar métricas en la Base 2' }, 500);
                }

                const filteredRanking = (rankingData || []).filter((item: any) => targetEans.includes(item.ean));

                // 3. Unir resultados con los datos comerciales de la Base 1
                const enrichedRanking = filteredRanking.slice(0, limit).map((item: any) => {
                    const prodInfo = productoMap.get(item.ean);
                    return {
                        ean: item.ean,
                        productName: prodInfo.nombre,
                        brand: prodInfo.marca?.trim() || 'Sin marca',
                        comparisonCount: Number(item.comparison_count),
                    };
                });

                return c.json({
                    success: true,
                    keyword: keyword.trim(),
                    totalCoincidenciasCatalogo: targetEans.length,
                    ranking: enrichedRanking,
                });

            } catch (err) {
                console.error('[ADMIN BUSQUEDA EXCEPTION]', err);
                return c.json({ success: false, error: 'Error interno al procesar la búsqueda analítica' }, 500);
            }
        }
    )
    .get(
        '/admin/metrics/chart-summary',
        async (c) => {
            try {
                const metricName = c.req.query('metricName');
                const search = c.req.query('search');
                const field = c.req.query('field');
                const startDate = c.req.query('startDate');
                const endDate = c.req.query('endDate');

                const { data, error } = await supabaseAnalytics.rpc('get_analytics_timeline_summary', {
                    p_metric_name: metricName || null,
                    p_search: search || null,
                    p_field: field || null,
                    p_start_date: startDate ? `${startDate}T00:00:00Z` : null,
                    p_end_date: endDate ? `${endDate}T23:59:59Z` : null,
                });

                if (error) {
                    console.error('[CHART SUMMARY RPC ERROR]:', error);
                    return c.json({ success: false, error: 'Error al obtener resumen temporal para el gráfico' }, 500);
                }

                return c.json({
                    success: true,
                    timeline: data || [],
                });

            } catch (err) {
                console.error('[ADMIN CHART SUMMARY EXCEPTION]', err);
                return c.json({ success: false, error: 'Error interno al procesar el resumen del gráfico' }, 500);
            }
        }
    )
    // --- NUEVAS RUTAS DE SOPORTE PARA ADMINISTRADOR ---
    .get(
        '/admin/support-messages',
        async (c) => {
            try {
                const search = c.req.query('search');
                const category = c.req.query('category');
                const status = c.req.query('status');
                const email = c.req.query('email');
                const region = c.req.query('region');
                const startDate = c.req.query('startDate');
                const endDate = c.req.query('endDate');

                let query = supabaseAnalytics
                    .from('support_messages')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false });

                if (search && search.trim() !== '') {
                    query = query.ilike('message', `%${search.trim()}%`);
                }
                if (category && category !== 'all') {
                    query = query.eq('subject_category', category);
                }
                if (status && status !== 'all') {
                    query = query.eq('status', status);
                }
                if (email && email.trim() !== '') {
                    query = query.ilike('user_email', `%${email.trim()}%`);
                }
                if (region && region !== 'all') {
                    query = query.eq('region', region);
                }
                if (startDate) {
                    query = query.gte('created_at', `${startDate}T00:00:00Z`);
                }
                if (endDate) {
                    query = query.lte('created_at', `${endDate}T23:59:59Z`);
                }

                const { data, error, count } = await query;

                if (error) {
                    console.error('[ADMIN SUPPORT MESSAGES ERROR]:', error);
                    return c.json({ success: false, error: error.message }, 500);
                }

                return c.json({
                    success: true,
                    messages: data || [],
                    total: count || 0,
                });
            } catch (err) {
                console.error('[ADMIN SUPPORT MESSAGES EXCEPTION]', err);
                return c.json({ success: false, error: 'Error interno al listar mensajes de soporte' }, 500);
            }
        }
    )
    .patch(
        '/admin/support-messages/:id/status',
        async (c) => {
            try {
                const id = c.req.param('id');
                const body = await c.req.json();
                const { status } = body;

                if (!['pending', 'read', 'resolved'].includes(status)) {
                    return c.json({ success: false, error: 'Estado inválido' }, 400);
                }

                const { data, error } = await supabaseAnalytics
                    .from('support_messages')
                    .update({ status })
                    .eq('id', id)
                    .select()
                    .single();

                if (error) {
                    console.error('[ADMIN SUPPORT STATUS ERROR]:', error);
                    return c.json({ success: false, error: error.message }, 500);
                }

                return c.json({
                    success: true,
                    message: data,
                });
            } catch (err) {
                console.error('[ADMIN SUPPORT STATUS EXCEPTION]', err);
                return c.json({ success: false, error: 'Error interno al actualizar estado del mensaje' }, 500);
            }
        }
    )
    // --- NUEVAS RUTAS DE GESTIÓN DE BACKUPS ---
    .get(
        '/admin/backups',
        async (c) => {
            try {
                // Listamos los archivos del bucket 'backups' en la Base 2 (Analíticas)
                const { data, error } = await supabaseAnalytics.storage
                    .from('backups')
                    .list('', {
                        limit: 100,
                        sortBy: { column: 'created_at', order: 'desc' }
                    });

                if (error) {
                    console.error('[ADMIN BACKUPS LIST ERROR]:', error);
                    return c.json({ success: false, error: error.message }, 400);
                }

                return c.json({
                    success: true,
                    backups: data || [],
                });
            } catch (err) {
                console.error('[ADMIN BACKUPS LIST EXCEPTION]', err);
                return c.json({ success: false, error: 'Error interno al listar los respaldos' }, 500);
            }
        }
    )
    .get(
        '/admin/backups/download',
        async (c) => {
            const filename = c.req.query('filename');
            if (!filename) {
                return c.json({ success: false, error: 'Falta el nombre del archivo' }, 400);
            }

            try {
                // Generar un link firmado válido por 60 segundos para descargar de forma segura
                const { data, error } = await supabaseAnalytics.storage
                    .from('backups')
                    .createSignedUrl(filename, 60);

                if (error) {
                    console.error('[ADMIN BACKUPS SIGN URL ERROR]:', error);
                    return c.json({ success: false, error: error.message }, 400);
                }

                return c.json({
                    success: true,
                    downloadUrl: data.signedUrl,
                });
            } catch (err) {
                console.error('[ADMIN BACKUPS SIGN URL EXCEPTION]', err);
                return c.json({ success: false, error: 'Error interno al generar enlace de descarga' }, 500);
            }
        }
    );