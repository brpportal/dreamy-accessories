import { requireAdmin } from '@/lib/auth/admin';
import CategoriesManager from '@/components/admin/categories-manager';
export default async function Page() { await requireAdmin(); return <main className="p-5 md:p-10"><div className="mx-auto max-w-6xl"><h1 className="mb-4 text-3xl font-semibold">Categories</h1><p className="mb-6 text-sm text-gray-600">Create categories here, then pick one on each product. Categories appear as filter chips and tiles on the storefront.</p><CategoriesManager /></div></main>; }
