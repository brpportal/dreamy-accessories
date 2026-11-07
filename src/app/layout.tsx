import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Dreamy Accessories | Your Style, Your Dream', description: 'Discover beautiful accessories delivered across Pakistan. Advance payment via Easypaisa and JazzCash.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
