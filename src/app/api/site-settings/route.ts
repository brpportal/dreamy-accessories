import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
// Public, read-only business settings (rows with is_public = true). No secrets are exposed here.
export async function GET() {
  try {
    const s = await createSupabaseServerClient();
    const { data, error } = await s.from('website_settings').select('setting_key,setting_value').in('setting_key', ['store', 'delivery', 'whatsapp', 'social']);
    if (error) throw error;
    const m: Record<string, Record<string, unknown>> = {};
    (data || []).forEach((r: { setting_key: string; setting_value: Record<string, unknown> }) => { m[r.setting_key] = r.setting_value || {}; });
    return NextResponse.json({
      storeName: (m.store?.store_name as string) || 'Sparklesbyfarry',
      announcement: (m.store?.announcement_text as string) || '',
      deliveryFee: Number(m.delivery?.delivery_fee ?? 0),
      supportNumber: (m.whatsapp?.support_number as string) || (m.whatsapp?.order_receiving_number as string) || '',
      supportMessage: (m.whatsapp?.support_message as string) || 'Assalamualaikum! I need help with Sparklesbyfarry.',
      buttonEnabled: m.whatsapp?.button_enabled !== false,
      instagram: (m.social?.instagram_url as string) || '',
      facebook: (m.social?.facebook_url as string) || ''
    });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to load settings' }, { status: 503 }); }
}
