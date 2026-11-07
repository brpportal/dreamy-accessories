import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export async function GET(){
  try {
    const supabase=await createSupabaseServerClient();
    const {data,error}=await supabase.from('products').select('id,name,slug,description,price,sale_price,stock_quantity,is_featured,categories(name),product_images(image_url,display_order)').eq('is_active',true).order('created_at',{ascending:false}).limit(60);
    if(error) throw error;
    return NextResponse.json({products:data??[]});
  } catch(error){ return NextResponse.json({error:error instanceof Error?error.message:'Unable to load products'},{status:503}); }
}
