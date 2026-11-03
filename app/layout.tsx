import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// IBM Plex Sans para todo el sitio, servida con el sitio (no desde Google
// Fonts, que a veces falla en el build de Cloudflare).
const plexSans = localFont({
  src: [
    { path: '../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-300-normal.woff2', weight: '300' },
    { path: '../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2', weight: '400' },
    { path: '../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2', weight: '500' },
    { path: '../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2', weight: '600' },
  ],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Gonzalo Murguia, técnico IT y desarrollador',
  description:
    'Servicio técnico de computadoras y redes en Buenos Aires, a domicilio o remoto, y desarrollo de sitios web, automatizaciones y telefonía IP.',
  icons: { icon: '/favicon.svg' },
};

// Aplica el tema elegido antes de pintar, para que no parpadee al cargar.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={plexSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
