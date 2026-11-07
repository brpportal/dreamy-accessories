'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
export default function AdminLogin(){
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key){setError('Supabase environment is not configured.');setBusy(false);return;}
  const supabase=createBrowserClient(url,key); const {error:loginError}=await supabase.auth.signInWithPassword({email,password});
  if(loginError){setError(loginError.message);setBusy(false);return;}
  const {data:{user}}=await supabase.auth.getUser(); const {data:admin}=await supabase.from('admin_users').select('is_active').eq('user_id',user?.id).maybeSingle();
  if(!admin?.is_active){await supabase.auth.signOut();setError('This account is not authorized as an active administrator.');setBusy(false);return;}
  router.push('/admin/dashboard/settings');router.refresh();
 }
 return <main className="min-h-screen grid place-items-center p-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-pink-100 bg-white p-8 shadow-xl shadow-pink-100"><p className="text-center text-xs tracking-[.25em] text-pink-600">DREAMY ACCESSORIES</p><h1 className="mt-3 text-center text-3xl font-semibold" style={{fontFamily:'Georgia,serif'}}>Admin Login</h1><p className="mt-2 text-center text-sm text-gray-500">Sign in with your authorized admin account.</p><label className="mt-7 block text-sm font-medium">Email<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border p-3 outline-pink-400"/></label><label className="mt-4 block text-sm font-medium">Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border p-3 outline-pink-400"/></label>{error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="mt-6 w-full rounded-xl bg-[#c7437f] p-3 font-semibold text-white disabled:opacity-50">{busy?'Signing in…':'Sign In'}</button></form></main>
}
