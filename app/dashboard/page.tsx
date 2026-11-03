import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Dashboard from './dashboard';

// Tipografía del dashboard: IBM Plex Sans, liviana en titulares y números
// grandes, y con cifras de ancho fijo para que no "bailen" al actualizarse.
// Salen de los paquetes de @fontsource y no de Google Fonts: en el build de
// Cloudflare, Google a veces responde sin los archivos y el deploy falla.
const plexSans = localFont({
  src: [
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-300-normal.woff2', weight: '300' },
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2', weight: '600' },
  ],
  variable: '--d-font-sans',
});

// Página privada: Cloudflare Access la protege antes de que llegue al Worker,
// y /api/dashboard vuelve a verificar la sesión antes de devolver datos.
// También se puede instalar como app (PWA): manifiesto, ícono y service worker
// viven fuera de /dashboard para que el celular los lea sin pasar por Access.
export const metadata: Metadata = {
  title: 'Centro de control littlemc',
  robots: { index: false, follow: false },
  manifest: '/littlemc.webmanifest',
  appleWebApp: { capable: true, title: 'littlemc', statusBarStyle: 'black-translucent' },
  icons: { icon: '/favicon.svg', apple: '/icons/littlemc-apple-180.png' },
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e6e2dc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1013' },
  ],
};

export default function DashboardPage() {
  return <Dashboard fontClassName={plexSans.variable} />;
}
