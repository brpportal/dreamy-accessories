import {requireAdmin} from '@/lib/auth/admin';import ProductsManager from '@/components/admin/products-manager';
export default async function Page(){await requireAdmin();return <main className="p-5 md:p-10"><div className="mx-auto max-w-6xl"><h1 className="mb-4 text-3xl font-semibold">Products &amp; images</h1><ProductsManager/></div></main>}
