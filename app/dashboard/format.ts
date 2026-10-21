// Formato de números, tamaños y tiempos para el dashboard (en castellano).

export type Tone = 'ok' | 'warn' | 'crit' | 'muted';

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toLocaleString('es-AR', { maximumFractionDigits: value < 10 && i > 0 ? 1 : 0 })} ${units[i]}`;
}

export const formatRate = (bps: number | null | undefined) => (bps == null ? '—' : `${formatBytes(bps)}/s`);

export function formatGB(gb: number | null | undefined): string {
  if (gb == null) return '—';
  return gb >= 1000 ? `${(gb / 1024).toLocaleString('es-AR', { maximumFractionDigits: 1 })} TB` : `${Math.round(gb)} GB`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function formatRelative(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return 'recién';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const pct = (n: number | null | undefined) => (n == null ? '—' : `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`);

export const toneFor = (value: number | null | undefined, warn: number, crit: number): Tone =>
  value == null ? 'muted' : value >= crit ? 'crit' : value >= warn ? 'warn' : 'ok';

// Umbrales usados en todo el dashboard.
export const LIMITS = {
  tempWarn: 70,
  tempCrit: 85,
  diskWarn: 80,
  diskCrit: 90,
  cpuWarn: 85,
  cpuCrit: 95,
  memWarn: 85,
  memCrit: 95,
  certWarnDays: 21,
  certCritDays: 7,
  backupStaleHours: 26,
  nodeStaleMinutes: 3,
};
