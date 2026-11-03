import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import Dashboard from './dashboard';

// Tipografías propias del dashboard: muy legibles en tamaños chicos y con
// números de ancho fijo, para que las cifras no "bailen" al actualizarse.
const plexSans = IBM_Plex_Sans({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--d-font-sans' });
const plexMono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--d-font-mono' });

// Página privada: Cloudflare Access la protege antes de que llegue al Worker,
// y /api/dashboard vuelve a verificar la sesión antes de devolver datos.
export const metadata: Metadata = {
  title: 'Centro de control · thesortty.dev',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f3f5' },
    { media: '(prefers-color-scheme: dark)', color: '#121417' },
  ],
};

export default function DashboardPage() {
  return <Dashboard fontClassName={`${plexSans.variable} ${plexMono.variable}`} />;
}
