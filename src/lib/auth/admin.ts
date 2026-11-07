import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/admin/login');
  const { data: admin, error: adminError } = await supabase
    .from('admin_users').select('role,is_active').eq('user_id', user.id).maybeSingle();
  if (adminError || !admin?.is_active || !['admin','super_admin'].includes(admin.role)) redirect('/admin/login?error=unauthorized');
  return { user, admin };
}
