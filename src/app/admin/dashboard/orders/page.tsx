import {requireAdmin} from '@/lib/auth/admin';
import OrdersManager from '@/components/admin/orders-manager';
export default async function OrdersPage(){await requireAdmin();return <main className="min-h-screen p-6 md:p-10"><div className="mx-auto max-w-6xl"><a href="/admin/dashboard" className="text-sm text-pink-700">← Dashboard</a><h1 className="my-4 text-3xl font-semibold">Orders & payments</h1><OrdersManager/></div></main>}
