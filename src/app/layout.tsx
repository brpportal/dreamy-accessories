import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/analytics-tracker';
const title = 'Dreamy Accessories | Your Style, Your Dream';
const description = 'Discover beautiful accessories delivered across Pakistan. Advance payment via Easypaisa and JazzCash.';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dreamy-accessories.vercel.app'),
  title, description,
  openGraph: { title, description, siteName: 'Dreamy Accessories', type: 'website', images: [{ url: '/og-cover.jpg', width: 1200, height: 630, alt: 'Dreamy Accessories' }] },
  twitter: { card: 'summary_large_image', title, description, images: ['/og-cover.jpg'] }
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><AnalyticsTracker/>{children}</body></html>; }
