import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ProductDetail from '@/components/product-detail';

export const dynamic = 'force-dynamic';
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; const s=await createSupabaseServerClient();
 const {data:p,error}=await s.from('products').select('id,name,slug,description,price,sale_price,stock_quantity,category_id,product_images(image_url,alt_text,display_order)').eq('slug',slug).eq('is_active',true).maybeSingle();
 if(error||!p)notFound();
 const [{data:rating},{data:reviews},{data:related}]=await Promise.all([
  s.rpc('get_product_rating_summary',{p_product_id:p.id}),
  s.from('product_reviews').select('id,customer_name,rating,review_title,review_text,created_at').eq('product_id',p.id).eq('moderation_status','approved').order('created_at',{ascending:false}).limit(20),
  s.rpc('get_related_products',{p_product_id:p.id,p_limit:4})
 ]);
 const ids=(related||[]).map((x:{id:string})=>x.id);
 const {data:relatedImages}=ids.length?await s.from('product_images').select('product_id,image_url').in('product_id',ids).order('display_order'): {data:[] as {product_id:string;image_url:string}[]};
 const imageMap=new Map((relatedImages||[]).map((x:{product_id:string;image_url:string})=>[x.product_id,x.image_url]));
 const ratingObj=Array.isArray(rating)?rating[0]:rating;
 return <><ProductDetail product={{...p,images:(p.product_images||[]).sort((a:{display_order:number},b:{display_order:number})=>a.display_order-b.display_order),rating:ratingObj,reviews:reviews||[],related:(related||[]).map((x:{id:string;name:string;slug:string;price:number;sale_price:number|null})=>({...x,image:imageMap.get(x.id)||null}))}}/></>;
}
