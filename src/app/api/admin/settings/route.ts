import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { businessSettingsSchema } from '@/lib/validation/settings';

async function authorize(){
 const supabase=await createSupabaseServerClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {error:NextResponse.json({error:'Unauthorized'},{status:401})};
 const {data:admin}=await supabase.from('admin_users').select('role,is_active').eq('user_id',user.id).maybeSingle();
 if(!admin?.is_active || !['admin','super_admin'].includes(admin.role))return {error:NextResponse.json({error:'Forbidden'},{status:403})};
 return {supabase,user};
}
export async function GET(){
 const auth=await authorize(); if('error' in auth)return auth.error;
 const {data,error}=await auth.supabase.from('website_settings').select('setting_key,setting_value').in('setting_key',['store','delivery','whatsapp','payments','social']);
 if(error)return NextResponse.json({error:error.message},{status:500});
 const map=Object.fromEntries((data??[]).map(r=>[r.setting_key,r.setting_value as Record<string,unknown>]));
 const s=map.store??{},d=map.delivery??{},w=map.whatsapp??{},p=map.payments??{},social=map.social??{};
 const ep=(p.easypaisa??{}) as Record<string,unknown>,jc=(p.jazzcash??{}) as Record<string,unknown>;
 return NextResponse.json({settings:{store_name:s.store_name??'Dreamy Accessories',currency:'PKR',delivery_fee:d.delivery_fee??299,free_delivery_enabled:d.free_delivery_enabled??false,free_delivery_threshold:d.free_delivery_threshold??null,whatsapp_order_number:w.order_receiving_number??'',whatsapp_support_number:w.support_number??'',whatsapp_display_name:w.display_name??'Dreamy Accessories',whatsapp_order_message:w.order_message??'',easypaisa_enabled:ep.enabled??true,easypaisa_number:ep.number??'03224754206',easypaisa_account_name:ep.account_name??'Farheen Hussain',jazzcash_enabled:jc.enabled??true,jazzcash_number:jc.number??'03400736445',jazzcash_account_name:jc.account_name??'Farheen Hussain',contact_email:s.contact_email??'',instagram_url:social.instagram_url??'',facebook_url:social.facebook_url??'',announcement_text:s.announcement_text??''}});
}
export async function PUT(request:Request){
 const auth=await authorize(); if('error' in auth)return auth.error;
 let body:unknown; try{body=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 const parsed=businessSettingsSchema.safeParse(body); if(!parsed.success)return NextResponse.json({error:'Validation failed',details:parsed.error.flatten()},{status:400});
 const v=parsed.data;
 const rows=[
  {setting_key:'store',setting_value:{store_name:v.store_name,currency:'PKR',currency_symbol:'Rs.',contact_email:v.contact_email,announcement_text:v.announcement_text},is_public:true,updated_by:auth.user.id},
  {setting_key:'delivery',setting_value:{delivery_fee:v.delivery_fee,coverage:'All Over Pakistan',free_delivery_enabled:v.free_delivery_enabled,free_delivery_threshold:v.free_delivery_threshold},is_public:true,updated_by:auth.user.id},
  {setting_key:'whatsapp',setting_value:{order_receiving_number:v.whatsapp_order_number,support_number:v.whatsapp_support_number,display_name:v.whatsapp_display_name,order_message:v.whatsapp_order_message},is_public:true,updated_by:auth.user.id},
  {setting_key:'payments',setting_value:{cod_enabled:false,advance_payment_required:true,easypaisa:{enabled:v.easypaisa_enabled,number:v.easypaisa_number,account_name:v.easypaisa_account_name},jazzcash:{enabled:v.jazzcash_enabled,number:v.jazzcash_number,account_name:v.jazzcash_account_name}},is_public:true,updated_by:auth.user.id},
  {setting_key:'social',setting_value:{instagram_url:v.instagram_url,facebook_url:v.facebook_url},is_public:true,updated_by:auth.user.id}
 ];
 const {error}=await auth.supabase.from('website_settings').upsert(rows,{onConflict:'setting_key'});
 if(error)return NextResponse.json({error:error.message},{status:500});
 await auth.supabase.from('audit_logs').insert({actor_user_id:auth.user.id,action:'update_business_settings',entity_type:'website_settings',entity_id:'business',new_values:{delivery_fee:v.delivery_fee,whatsapp_order_number:v.whatsapp_order_number,easypaisa_enabled:v.easypaisa_enabled,jazzcash_enabled:v.jazzcash_enabled}});
 return NextResponse.json({success:true,message:'Business settings saved.'});
}
