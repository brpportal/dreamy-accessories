import { Suspense } from 'react';
import type { Metadata } from 'next';
import ProductsPage from '@/components/products-page';

export const metadata: Metadata = { title: 'All Products | Sparklesbyfarry', description: 'Shop all Sparklesbyfarry products — makeup, accessories and more, delivered across Pakistan.' };

export default function Page() {
  return <Suspense fallback={<main className="min-h-screen bg-[#fff9fc]" />}><ProductsPage /></Suspense>;
}
