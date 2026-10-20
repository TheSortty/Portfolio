import type { Metadata } from 'next';
import Dashboard from './dashboard';

// Página privada: Cloudflare Access la protege antes de que llegue al Worker,
// y /api/dashboard vuelve a verificar la sesión antes de devolver datos.
export const metadata: Metadata = {
  title: 'Centro de control · thesortty.dev',
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <Dashboard />;
}
