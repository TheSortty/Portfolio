// Ilustraciones del dashboard, dibujadas a mano en SVG para que pesen poco y
// sigan el tema. El color del estado entra por la variable CSS --tone.

import { useId } from 'react';

type ArtProps = { className?: string };

/** Gabinete de PC, con el LED de encendido del color del estado. */
export function PcTower({ className = '' }: ArtProps) {
  // Ids únicos para los degradados, por si hay más de una PC en pantalla.
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 140 180" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-side`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--art-dark)" />
          <stop offset="1" stopColor="var(--art-mid)" />
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--art-light)" />
          <stop offset="1" stopColor="var(--art-mid)" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--tone)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--tone)" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <ellipse cx="72" cy="170" rx="58" ry="7" fill="var(--art-shadow)" />
      {/* lateral */}
      <path d="M20 22 L96 10 L96 160 L20 168 Z" fill={`url(#${id}-side)`} />
      <path d="M28 32 L88 23 L88 150 L28 157 Z" fill={`url(#${id}-glass)`} stroke="var(--art-line)" strokeWidth="1" />
      {/* ventiladores detrás del vidrio */}
      {[58, 112].map((cy) => (
        <g key={cy} transform={`translate(58 ${cy})`} opacity="0.85">
          <circle r="17" fill="none" stroke="var(--tone)" strokeOpacity="0.55" strokeWidth="1.5" />
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d="M0 0 C5 -6 9 -12 4 -15" fill="none" stroke="var(--tone)" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${a})`} />
          ))}
          <circle r="3" fill="var(--tone)" fillOpacity="0.7" />
        </g>
      ))}
      {/* frente */}
      <path d="M96 10 L124 16 L124 158 L96 160 Z" fill={`url(#${id}-front)`} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="102" x2="118" y1={60 + i * 9} y2={61 + i * 9} stroke="var(--art-line)" strokeWidth="2" strokeLinecap="round" />
      ))}
      <circle cx="110" cy="32" r="5.5" fill="var(--art-dark)" />
      <circle cx="110" cy="32" r="2.6" fill="var(--tone)" className="d-art-led" />
      <rect x="104" y="44" width="12" height="3" rx="1.5" fill="var(--art-dark)" />
    </svg>
  );
}

/** Router con antenas, para la tarjeta de red. */
export function Router({ className = '' }: ArtProps) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden>
      <ellipse cx="80" cy="92" rx="62" ry="5" fill="var(--art-shadow)" />
      {[28, 58, 102, 132].map((x, i) => (
        <rect key={x} x={x - 3} y={i % 3 === 0 ? 12 : 4} width="6" height={i % 3 === 0 ? 58 : 66} rx="3" fill="var(--art-light)" transform={`rotate(${(i - 1.5) * 5} ${x} 70)`} />
      ))}
      <path d="M16 70 Q16 62 26 62 L134 62 Q144 62 144 70 L140 84 Q139 88 134 88 L26 88 Q21 88 20 84 Z" fill="var(--art-light)" />
      <path d="M20 80 L140 80 L140 84 Q139 88 134 88 L26 88 Q21 88 20 84 Z" fill="var(--art-mid)" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={64 + i * 10} cy="72" r="2" fill="var(--tone)" opacity={i < 3 ? 1 : 0.35} />
      ))}
    </svg>
  );
}

/** Bloque de pasto en isométrica, para los servidores de juego. */
export function GrassBlock({ className = '' }: ArtProps) {
  return (
    <svg viewBox="0 0 100 104" className={className} aria-hidden>
      <ellipse cx="50" cy="98" rx="36" ry="5" fill="var(--art-shadow)" />
      <path d="M50 6 L92 28 L50 50 L8 28 Z" fill="#6aa84f" />
      <path d="M50 6 L92 28 L80 34 L50 18 L20 34 L8 28 Z" fill="#7fbf5c" />
      <path d="M8 28 L50 50 L50 96 L8 74 Z" fill="#8a5a33" />
      <path d="M92 28 L50 50 L50 96 L92 74 Z" fill="#6e4526" />
      <path d="M8 28 L50 50 L50 60 L42 56 L42 52 L34 52 L28 46 L20 44 L16 38 L8 36 Z" fill="#5c9a3f" />
      <path d="M92 28 L50 50 L50 58 L58 54 L64 56 L70 50 L78 48 L84 42 L92 40 Z" fill="#4e8535" />
      <rect x="18" y="58" width="6" height="6" fill="#a87545" />
      <rect x="30" y="70" width="6" height="6" fill="#74482a" />
      <rect x="62" y="68" width="6" height="6" fill="#58361c" />
      <rect x="76" y="58" width="6" height="6" fill="#875733" />
    </svg>
  );
}

/** Nube con candado: la copia cifrada en Google Drive. */
export function CloudVault({ className = '' }: ArtProps) {
  return (
    <svg viewBox="0 0 140 100" className={className} aria-hidden>
      <path
        d="M38 82 Q14 82 14 62 Q14 44 33 42 Q36 18 62 18 Q82 18 89 36 Q94 32 102 32 Q122 32 124 54 Q134 58 134 70 Q134 82 118 82 Z"
        fill="var(--art-light)"
      />
      <path d="M38 82 Q14 82 14 62 Q14 70 34 72 L118 72 Q132 72 134 66 Q134 82 118 82 Z" fill="var(--art-mid)" />
      <rect x="58" y="50" width="26" height="22" rx="4" fill="var(--tone)" />
      <path d="M63 50 V44 Q63 36 71 36 Q79 36 79 44 V50" fill="none" stroke="var(--tone)" strokeWidth="4" />
      <circle cx="71" cy="60" r="3" fill="var(--art-light)" />
    </svg>
  );
}
