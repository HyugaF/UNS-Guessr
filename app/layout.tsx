import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono, Newsreader } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-editorial',
  weight: ['500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UNSGuessr - Tebak Lokasi Kampus Universitas Sebelas Maret',
  description:
    'Game tebak lokasi kampus Universitas Sebelas Maret (UNS) dengan Google Street View 360° di Kentingan, Manahan, Kleco, dan Mesen.',
  openGraph: {
    title: 'UNSGuessr - Tebak Lokasi Kampus Universitas Sebelas Maret',
    description:
      'Game tebak lokasi kampus Universitas Sebelas Maret (UNS) dengan Google Street View 360° di Kentingan, Manahan, Kleco, dan Mesen.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNSGuessr - Tebak Lokasi Kampus Universitas Sebelas Maret',
    description:
      'Game tebak lokasi kampus Universitas Sebelas Maret (UNS) dengan Google Street View 360° di Kentingan, Manahan, Kleco, dan Mesen.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#0C0E11] text-[#F2F0EB] antialiased selection:bg-[#E2B34B]/30 selection:text-[#F2F0EB] overflow-x-hidden"
      >
        {children}
      </body>
    </html>
  );
}
