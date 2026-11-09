import { rateLimit, tooMany } from '@/lib/rate-limit';
import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {createSupabaseServerClient} from '@/lib/supabase/server';
const schema=z.object({orderNumber:z.string().trim().min(4).max(40),phone:z.string().trim().min(10).max(25),transactionReference:z.string().trim().min(4).max(100)});
export async function POST(req:NextRequest){
  if(!rateLimit(req,'proof',10,60000)) return tooMany();const d=schema.safeParse(await req.json().catch(()=>null));if(!d.success)return NextResponse.json({error:'Enter your order number, checkout phone and transaction ID.'},{status:400});const s=await createSupabaseServerClient();const {data,error}=await s.rpc('submit_payment_proof',{p_order_number:d.data.orderNumber,p_customer_phone:d.data.phone,p_transaction_reference:d.data.transactionReference,p_payment_proof_url:null});if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({result:data},{status:200});}
