import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getAuthorizedAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { supabase, user: null, admin: null };
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('role,is_active')
    .eq('user_id', user.id)
    .maybeSingle();
  if (adminError || !admin?.is_active || !['admin', 'super_admin'].includes(admin.role)) {
    return { supabase, user: null, admin: null };
  }
  return { supabase, user, admin };
}
