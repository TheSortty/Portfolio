import type {Metadata} from 'next';
import { Tajawal, Fira_Code } from 'next/font/google';
import './globals.css'; // Global styles

const tajawal = Tajawal({
  weight: ['400', '500', '700', '800'],
  subsets: ['latin', 'arabic'],
  variable: '--font-primary',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-code',
});

export const metadata: Metadata = {
  title: 'Gonzalo Murguia - Técnico & Desarrollador',
  description: 'Portfolio profesional de Gonzalo Murguia. Servicios técnicos y desarrollo web.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${tajawal.variable} ${firaCode.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
