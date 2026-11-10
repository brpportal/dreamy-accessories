'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error('Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in Vercel, then redeploy.');

      const supabase = createBrowserClient(url, key);
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (loginError) throw new Error(loginError.message);
      if (!data.user) throw new Error('Login could not be verified. Please try again.');

      const { data: admin, error: adminError } = await supabase
        .from('admin_users').select('role,is_active').eq('user_id', data.user.id).maybeSingle();
      if (adminError) throw new Error(`Admin verification failed: ${adminError.message}`);
      if (!admin?.is_active || !['admin', 'super_admin'].includes(admin.role)) {
        await supabase.auth.signOut();
        throw new Error('This account is not authorized as an active administrator.');
      }
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to sign in. Please try again.';
      setError(/failed to fetch|networkerror|fetch failed/i.test(message)
        ? 'Supabase se connection nahi ho raha. Vercel environment variables, redeployment, aur internet connection check karein.'
        : message);
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fff8fb] px-4 py-10 text-[#382638]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-pink-200/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-rose-100/80 blur-3xl" />
      <section className="relative w-full max-w-[440px] overflow-hidden rounded-[2rem] border border-white/90 bg-white/90 p-7 shadow-[0_28px_90px_rgba(139,55,99,.14)] backdrop-blur-xl sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#b94b83] to-[#81365f] text-white shadow-lg shadow-pink-200"><ShieldCheck size={27}/></div>
        <p className="mt-5 text-center text-[10px] font-bold tracking-[.32em] text-[#b14b7c]">DREAMY ACCESSORIES</p>
        <h1 className="mt-3 text-center font-serif text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-center text-sm leading-6 text-[#8b7886]">Sign in to your secure store control centre.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold">Email address
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-[#eadde5] bg-[#fffafd] px-4 transition focus-within:border-[#bd5a8a] focus-within:ring-4 focus-within:ring-pink-100"><Mail size={17} className="shrink-0 text-[#b45a85]"/><input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"/></span>
          </label>
          <label className="block text-sm font-semibold">Password
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-[#eadde5] bg-[#fffafd] px-4 transition focus-within:border-[#bd5a8a] focus-within:ring-4 focus-within:ring-pink-100"><LockKeyhole size={17} className="shrink-0 text-[#b45a85]"/><input required type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} className="rounded-lg p-1.5 text-[#8f7183] hover:bg-pink-50 hover:text-[#a83c70]">{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></span>
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</p>}
          <button disabled={busy} className="flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#b94b83] to-[#923866] px-5 text-sm font-bold text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">{busy?'Verifying access…':'Sign in securely'}</button>
        </form>
        <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-[#a18b99]"><LockKeyhole size={13}/> Authorized administrators only</div>
      </section>
      <p className="relative mt-6 text-center text-xs text-[#a18b99]">Sparklesbyfarry · Private Admin Portal</p>
    </main>
  );
}
