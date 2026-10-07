// app/api/_middlewares/checkLimits.ts
import { USER_LIMITS } from '@/app/_lib/constants/limites';
import { Context } from 'hono';

export async function checkUserLimit(
  c: Context,
  supabase: any,
  userId: string,
  recurso: 'listas' | 'direcciones' | 'items_lista' | 'editores',
  parentId?: string // listaId si evaluamos items o editores
) {
  let count = 0;
  let maxLimit = 0;
  let mensaje = '';

  switch (recurso) {
    case 'listas':
          maxLimit = USER_LIMITS.MAX_LISTAS;
          const { count: cListas } = await supabase
            .from('listas')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', userId); 
          count = cListas || 0;
          mensaje = `Has alcanzado el límite máximo de ${maxLimit} listas guardadas.`;
          break;

    case 'direcciones':
          maxLimit = USER_LIMITS.MAX_DIRECCIONES;
          const { count: cDirs } = await supabase
            .from('direcciones_usuario') 
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId); 
          count = cDirs || 0;
          mensaje = `Has alcanzado el límite máximo de ${maxLimit} direcciones guardadas.`;
          break;

    case 'items_lista':
          if (!parentId) break;
          maxLimit = USER_LIMITS.MAX_ITEMS_POR_LISTA;
          const { count: cItems } = await supabase
            .from('lista_items') 
            .select('*', { count: 'exact', head: true })
            .eq('list_id', parentId); 
          count = cItems || 0;
          mensaje = `Esta lista no puede tener más de ${maxLimit} productos.`;
          break;

      case 'editores':
        if (!parentId) break;
        maxLimit = USER_LIMITS.MAX_EDITORES_POR_LISTA;
        const { count: cEditores } = await supabase
          .from('list_members') 
          .select('*', { count: 'exact', head: true })
          .eq('list_id', parentId)
        count = cEditores || 0;
        mensaje = `Has alcanzado el límite de ${maxLimit} editores colaboradores para esta lista.`;
        break;
    }

  if (count >= maxLimit) {
    return c.json({ error: 'Límite alcanzado', message: mensaje }, 403);
  }

  return null; 
}