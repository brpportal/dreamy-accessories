import { rateLimit, tooMany } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
const schema=z.object({name:z.string().trim().min(2).max(100),phone:z.string().trim().min(10).max(25),city:z.string().trim().min(2).max(80),address:z.string().trim().min(8).max(500),paymentMethod:z.enum(['easypaisa','jazzcash']),items:z.array(z.object({id:z.string().uuid(),quantity:z.number().int().min(1).max(20)})).min(1).max(30).superRefine((items,ctx)=>{if(new Set(items.map(x=>x.id)).size!==items.length)ctx.addIssue({code:'custom',message:'Duplicate cart items'});})});
export async function POST(req:NextRequest){
  if(!rateLimit(req,'checkout',8,60000)) return tooMany();
  try {
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success) return NextResponse.json({error:'Please check your checkout details.'},{status:400});
    const supabase=await createSupabaseServerClient();
    const {data,error}=await supabase.rpc('create_guest_order',{p_customer_name:parsed.data.name,p_customer_phone:parsed.data.phone,p_customer_city:parsed.data.city,p_customer_address:parsed.data.address,p_payment_method:parsed.data.paymentMethod,p_items:parsed.data.items});
    if(error) return NextResponse.json({error:error.message},{status:400});
    const {data:waSetting}=await supabase.from('website_settings').select('setting_value').eq('setting_key','whatsapp').maybeSingle();
    const whatsapp=waSetting?.setting_value as {order_receiving_number?:string;support_number?:string}|null;
    return NextResponse.json({order:{...data,whatsapp_number:whatsapp?.order_receiving_number||whatsapp?.support_number||''}},{status:201});
  } catch { return NextResponse.json({error:'Unable to place order. Please try again.'},{status:400}); }
}
