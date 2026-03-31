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
  title: 'Portfolio',
  description: 'My Professional Portfolio',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${tajawal.variable} ${firaCode.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
