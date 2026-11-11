import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export async function GET(){
  try {
    const supabase=await createSupabaseServerClient();
    const {data,error}=await supabase.from('products').select('id,name,slug,description,price,sale_price,stock_quantity,is_featured,category_id,variants,categories(name),product_images(image_url,display_order)').eq('is_active',true).order('created_at',{ascending:false}).limit(60);
    if(error) throw error;
    const ids=(data??[]).map((p:{id:string})=>p.id);
    // Rating aggregates are computed here on the server from APPROVED reviews only; only the totals reach the client.
    const agg=new Map<string,{sum:number;count:number}>();
    if(ids.length){
      const {data:rv}=await supabase.from('product_reviews').select('product_id,rating').in('product_id',ids).eq('moderation_status','approved').limit(5000);
      (rv??[]).forEach((r:{product_id:string;rating:number})=>{const a=agg.get(r.product_id)||{sum:0,count:0};a.sum+=r.rating;a.count+=1;agg.set(r.product_id,a);});
    }
    const products=(data??[]).map((p:{id:string})=>{const a=agg.get(p.id);return {...p,rating_average:a?Math.round((a.sum/a.count)*10)/10:0,rating_count:a?a.count:0};});
    return NextResponse.json({products});
  } catch(error){ return NextResponse.json({error:error instanceof Error?error.message:'Unable to load products'},{status:503}); }
}
