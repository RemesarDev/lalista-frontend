import { supabaseAnalytics } from '@/app/_lib/supabase';

interface InsertSupportParams {
  userId: string;
  userName: string;
  userEmail: string;
  subjectCategory: string;
  message: string;
  region: string | null;
}

export async function insertSupportMessage({
  userId,
  userName,
  userEmail,
  subjectCategory,
  message,
  region,
}: InsertSupportParams) {
  
  // 1. RATE LIMIT: Verificar cuántos mensajes mandó el usuario en las últimas 24 horas
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error: countError } = await supabaseAnalytics
    .from('support_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', twentyFourHoursAgo);

  if (countError) {
    throw new Error('Error al verificar el límite de mensajes.');
  }

  if (count !== null && count >= 3) {
    throw new Error('Has alcanzado el límite máximo de 3 mensajes de soporte por día. Por favor, intenta mañana.');
  }

  // 2. Insertar el mensaje si pasó el filtro
  const { data, error } = await supabaseAnalytics
    .from('support_messages')
    .insert([
      {
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        subject_category: subjectCategory,
        message,
        region,
        status: 'pending',
      },
    ])
    .select();

  if (error) {
    throw new Error(`Error en DB2 al guardar mensaje de soporte: ${error.message}`);
  }

  return data;
}