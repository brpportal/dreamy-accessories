import { requireAdmin } from '@/lib/auth/admin';
import AnalyticsDashboard from '@/components/admin/analytics-dashboard';
export default async function Page() { await requireAdmin(); return <main className="p-5 md:p-10"><div className="mx-auto max-w-6xl"><h1 className="mb-1 text-3xl font-semibold">Store insights</h1><p className="mb-6 text-sm text-gray-600">What customers buy, search, like and ignore — and where they come from.</p><AnalyticsDashboard /></div></main>; }
