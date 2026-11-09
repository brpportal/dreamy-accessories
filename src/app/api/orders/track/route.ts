import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {createSupabaseServerClient} from '@/lib/supabase/server';
const schema=z.object({orderNumber:z.string().trim().min(4).max(40),phone:z.string().trim().min(10).max(25)});
export async function POST(req:NextRequest){const d=schema.safeParse(await req.json().catch(()=>null));if(!d.success)return NextResponse.json({error:'Enter a valid order number and phone.'},{status:400});const s=await createSupabaseServerClient();const {data,error}=await s.rpc('track_guest_order',{p_order_number:d.data.orderNumber,p_customer_phone:d.data.phone});if(error)return NextResponse.json({error:error.message},{status:404});return NextResponse.json({order:data});}
