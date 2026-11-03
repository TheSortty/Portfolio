import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Dashboard from './dashboard';

// Tipografías propias del dashboard: muy legibles en tamaños chicos y con
// números de ancho fijo, para que las cifras no "bailen" al actualizarse.
// Salen de los paquetes de @fontsource y no de Google Fonts: en el build de
// Cloudflare, Google a veces responde sin los archivos y el deploy falla.
const plexSans = localFont({
  src: [
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2', weight: '600' },
  ],
  variable: '--d-font-sans',
});
const plexMono = localFont({
  src: [
    { path: '../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', weight: '500' },
  ],
  variable: '--d-font-mono',
});

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
