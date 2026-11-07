import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import SettingsForm from './settings-form';
export default async function SettingsPage(){await requireAdmin();return <main className="min-h-screen p-5 md:p-10"><div className="mx-auto max-w-5xl"><Link href="/admin/dashboard" className="text-sm text-pink-700">← Dashboard</Link><p className="mt-5 text-xs tracking-[.2em] text-pink-700">DREAMY ACCESSORIES / CONFIGURATION</p><h1 className="mt-2 text-3xl font-semibold">Business Settings</h1><p className="mt-2 mb-7 text-sm text-gray-600">Manage delivery, WhatsApp, payment accounts and store information.</p><SettingsForm/></div></main>}
