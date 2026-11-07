import Link from 'next/link';
import CheckoutForm from './checkout-form';
export const metadata={title:'Checkout | Dreamy Accessories'};
export default function CheckoutPage(){return <main className="min-h-screen bg-[#fff8fb] px-4 py-10 text-[#382431]"><div className="mx-auto max-w-3xl"><Link href="/" className="text-sm text-[#a83c70]">← Continue shopping</Link><h1 className="mt-6 font-serif text-4xl">Complete your order</h1><p className="mt-2 text-sm text-[#927b87]">Guest checkout · No account or email required</p><CheckoutForm/></div></main>}
