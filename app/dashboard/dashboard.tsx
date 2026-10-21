'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Archive,
  ArrowDown,
  ArrowUp,
  Box,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Cloud,
  CloudOff,
  Cpu,
  ExternalLink,
  Gamepad2,
  HardDrive,
  LoaderCircle,
  Lock,
  MemoryStick,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
} from 'lucide-react';
import {
  isError,
  type Backups,
  type GameServer,
  type GameServers,
  type HistoryPoint,
  type OriginCert,
  type Overview,
  type ServerNode,
  type Service,
} from '@/lib/dashboard/types';
import {
  LIMITS,
  formatBytes,
  formatDateTime,
  formatDuration,
  formatGB,
  formatRate,
  formatRelative,
  pct,
  toneFor,
  type Tone,
} from './format';

const REFRESH_MS = 30_000;

const LINKS = [
  { label: 'Panel', href: 'https://panel.thesortty.dev' },
  { label: 'Uptime Kuma', href: 'https://kuma.thesortty.dev' },
];

// ---------- piezas visuales ----------

const toneText: Record<Tone, string> = {
  ok: 'text-[var(--primary)]',
  warn: 'text-[var(--accent)]',
  crit: 'text-[#F87171]',
  muted: 'text-[var(--text-muted)]',
};
const toneBg: Record<Tone, string> = {
  ok: 'bg-[var(--primary)]',
  warn: 'bg-[var(--accent)]',
  crit: 'bg-[#F87171]',
  muted: 'bg-[var(--text-muted)]',
};
const toneChip: Record<Tone, string> = {
  ok: 'border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]',
  warn: 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]',
  crit: 'border-[#F87171]/40 bg-[#F87171]/10 text-[#F87171]',
  muted: 'border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)]',
};

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5! py-0.5! text-xs font-bold whitespace-nowrap ${toneChip[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${toneBg[tone]}`} aria-hidden />
      {children}
    </span>
  );
}

function Card({ title, icon: Icon, action, children, className = '' }: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5! sm:p-6! ${className}`}>
      <header className="mb-5! flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-lg font-bold text-[var(--text-primary)]">
          <Icon className="h-5 w-5 text-[var(--cyan)]" aria-hidden />
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Bar({ value, tone }: { value: number | null; tone: Tone }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-hover)]" role="presentation">
      <div className={`h-full rounded-full transition-[width] duration-500 ${toneBg[tone]}`} style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }} />
    </div>
  );
}

function Sparkline({ points, field, max, tone }: { points: HistoryPoint[]; field: 'cpu' | 'temp' | 'mem'; max: number; tone: Tone }) {
  const values = points.map((p) => p[field]).filter((v): v is number => v != null);
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const step = w / (values.length - 1);
  const y = (v: number) => h - 2 - (Math.min(v, max) / max) * (h - 4);
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-8 w-full ${toneText[tone]}`} preserveAspectRatio="none" aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="currentColor" opacity="0.12" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={w} cy={y(values[values.length - 1])} r="2.2" fill="currentColor" />
    </svg>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-[#F87171]/30 bg-[#F87171]/5 px-4! py-3! text-sm text-[#F87171]">
      <CircleAlert className="h-4 w-4 shrink-0" aria-hidden /> {message}
    </p>
  );
}

const mono = 'font-[family-name:var(--font-code)] tabular-nums';

// ---------- PCs ----------

function Metric({ icon: Icon, label, value, detail, tone, bar, spark }: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail?: string;
  tone: Tone;
  bar?: number | null;
  spark?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-[var(--bg-darker)]/60 p-3.5!">
      <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-[var(--text-muted)] uppercase">
        <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
      </span>
      <span className={`text-2xl font-bold leading-none ${mono} ${toneText[tone]}`}>{value}</span>
      {detail && <span className="text-xs text-[var(--text-muted)]">{detail}</span>}
      {bar !== undefined && <Bar value={bar} tone={tone} />}
      {spark}
    </div>
  );
}

function NodeCard({ node, now }: { node: ServerNode; now: number }) {
  const [showContainers, setShowContainers] = useState(false);
  const stale = !node.updatedAt || now - new Date(node.updatedAt).getTime() > LIMITS.nodeStaleMinutes * 60_000;
  const statusTone: Tone = node.status === 'up' && !stale ? 'ok' : node.status === 'paused' ? 'muted' : 'crit';
  const statusLabel = node.status === 'up' ? (stale ? 'Sin datos recientes' : 'En línea') : node.status === 'paused' ? 'En pausa' : 'Desconectada';
  const tempTone = toneFor(node.cpuTemp, LIMITS.tempWarn, LIMITS.tempCrit);
  const cpuTone = toneFor(node.cpuPct, LIMITS.cpuWarn, LIMITS.cpuCrit);
  const memTone = toneFor(node.memPct, LIMITS.memWarn, LIMITS.memCrit);
  const unhealthy = node.containers.filter((c) => c.health === 'unhealthy').length;

  return (
    <article className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-dark)]/40 p-4! sm:p-5!">
      <div className="mb-4! flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Server className="h-5 w-5 text-[var(--text-secondary)]" aria-hidden />
          <h3 className={`text-lg font-bold ${mono}`}>{node.name}</h3>
          <Chip tone={statusTone}>{statusLabel}</Chip>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          Encendida hace {formatDuration(node.uptimeSec)} · actualizado {formatRelative(node.updatedAt, now)}
        </span>
      </div>

      <div className={statusTone === 'ok' ? '' : 'opacity-50'} title={statusTone === 'ok' ? undefined : 'Últimos datos recibidos'}>
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <Metric
          icon={Thermometer}
          label="Temperatura"
          value={node.cpuTemp == null ? '—' : `${Math.round(node.cpuTemp)} °C`}
          detail={`Alerta desde ${LIMITS.tempWarn} °C`}
          tone={tempTone}
          spark={<Sparkline points={node.history} field="temp" max={100} tone={tempTone === 'muted' ? 'ok' : tempTone} />}
        />
        <Metric
          icon={Cpu}
          label="CPU"
          value={pct(node.cpuPct)}
          detail={node.load ? `Carga ${node.load.map((l) => l.toFixed(2)).join(' · ')}` : undefined}
          tone={cpuTone}
          spark={<Sparkline points={node.history} field="cpu" max={100} tone={cpuTone === 'muted' ? 'ok' : cpuTone} />}
        />
        <Metric
          icon={MemoryStick}
          label="Memoria"
          value={pct(node.memPct)}
          detail={`${node.memUsedGB ?? '—'} de ${node.memTotalGB ?? '—'} GB`}
          tone={memTone}
          bar={node.memPct}
        />
      </div>

      <div className="mt-5! grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {node.disks.map((d) => {
          const tone = toneFor(d.pct, LIMITS.diskWarn, LIMITS.diskCrit);
          return (
            <div key={d.key} className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <HardDrive className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden /> {d.label}
                </span>
                <span className={`shrink-0 text-xs ${mono} ${tone === 'ok' ? 'text-[var(--text-muted)]' : toneText[tone]}`}>
                  {formatGB(d.usedGB)} / {formatGB(d.totalGB)} · {pct(d.pct)}
                </span>
              </div>
              <Bar value={d.pct} tone={tone} />
            </div>
          );
        })}
      </div>
      </div>

      <div className="mt-5! flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4! text-sm">
        <span className={`flex items-center gap-4 text-[var(--text-secondary)] ${mono}`}>
          <span className="flex items-center gap-1"><ArrowUp className="h-3.5 w-3.5 text-[var(--cyan)]" aria-label="Subida" />{formatRate(node.net?.upBps)}</span>
          <span className="flex items-center gap-1"><ArrowDown className="h-3.5 w-3.5 text-[var(--purple)]" aria-label="Bajada" />{formatRate(node.net?.downBps)}</span>
        </span>
        <button
          type="button"
          onClick={() => setShowContainers((v) => !v)}
          aria-expanded={showContainers}
          className="flex items-center gap-1.5 rounded-lg px-2! py-1! text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
        >
          <Box className="h-4 w-4" aria-hidden />
          {node.containers.length} contenedores{unhealthy > 0 && <span className="text-[#F87171]"> · {unhealthy} con problemas</span>}
          {showContainers ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
        </button>
      </div>

      {showContainers && (
        <ul className="mt-3! divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] text-sm">
          {node.containers.map((c) => (
            <li key={c.name} className="flex flex-wrap items-center justify-between gap-2 px-3! py-2!">
              <span className="flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${toneBg[c.health === 'unhealthy' ? 'crit' : c.status.startsWith('Up') ? 'ok' : 'muted']}`} aria-hidden />
                <span className={`truncate ${mono}`}>{c.name}</span>
              </span>
              <span className={`text-xs text-[var(--text-muted)] ${mono}`}>
                {c.status} · {c.memMB ?? '—'} MB · CPU {pct(c.cpuPct)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

// ---------- servidores de juego ----------

const GAME_STATE: Record<GameServer['state'], { label: string; tone: Tone }> = {
  running: { label: 'Encendido', tone: 'ok' },
  starting: { label: 'Iniciando', tone: 'warn' },
  stopping: { label: 'Apagando', tone: 'warn' },
  offline: { label: 'Apagado', tone: 'muted' },
  installing: { label: 'Instalando', tone: 'warn' },
  suspended: { label: 'Suspendido', tone: 'crit' },
  unknown: { label: 'Sin datos', tone: 'muted' },
};

function GameServersCard({ data }: { data: GameServers | { error: string } }) {
  return (
    <Card title="Servidores de juego" icon={Gamepad2}>
      {isError(data) ? (
        <SectionError message={data.error} />
      ) : !data.configured ? (
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Falta conectar Pterodactyl: creá un usuario para el dashboard y cargá su clave de API en el servidor.
        </p>
      ) : data.servers.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">El usuario del dashboard no tiene servidores asignados.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.servers.map((s) => {
            const st = GAME_STATE[s.state] ?? GAME_STATE.unknown;
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--bg-darker)]/60 px-4! py-3!">
                <div className="min-w-0">
                  <p className="truncate font-bold">{s.name}</p>
                  <p className={`text-xs text-[var(--text-muted)] ${mono}`}>
                    {s.node}{s.port ? ` · puerto ${s.port}` : ''}
                    {s.state === 'running' && ` · ${formatDuration((s.uptimeMs ?? 0) / 1000)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {s.state === 'running' && (
                    <span className={`text-xs text-[var(--text-secondary)] ${mono}`}>
                      {formatBytes(s.memBytes)}{s.limits.memMB ? ` / ${formatBytes(s.limits.memMB * 1024 * 1024)}` : ''} · CPU {pct(s.cpuPct)}
                    </span>
                  )}
                  <Chip tone={st.tone}>{st.label}</Chip>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ---------- servicios y certificado ----------

const SERVICE_STATE: Record<Service['status'], { label: string; tone: Tone }> = {
  up: { label: 'Funcionando', tone: 'ok' },
  down: { label: 'Caído', tone: 'crit' },
  pending: { label: 'Verificando', tone: 'warn' },
  maintenance: { label: 'Mantenimiento', tone: 'warn' },
  paused: { label: 'En pausa', tone: 'muted' },
  unknown: { label: 'Sin datos', tone: 'muted' },
};

function certTone(days: number | null | undefined): Tone {
  if (days == null) return 'muted';
  return days <= LIMITS.certCritDays ? 'crit' : days <= LIMITS.certWarnDays ? 'warn' : 'ok';
}

function ServicesCard({ services, cert, now }: { services: Service[] | { error: string }; cert: OriginCert | { error: string }; now: number }) {
  return (
    <Card title="Servicios" icon={Activity} className="lg:col-span-2">
      {isError(services) ? (
        <SectionError message={services.error} />
      ) : services.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No hay monitores en Uptime Kuma.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border)]">
          {services.map((s) => {
            const st = SERVICE_STATE[s.status] ?? SERVICE_STATE.unknown;
            return (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3! first:pt-0!">
                <div className="min-w-0">
                  <p className="font-bold">{s.name}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]" title={s.message ?? undefined}>
                    {s.status === 'down' && s.message
                      ? s.message
                      : s.status === 'paused'
                        ? 'En pausa en Uptime Kuma'
                        : `Revisado ${formatRelative(s.checkedAt, now)}`}
                  </p>
                </div>
                <div className={`flex items-center gap-3 text-xs text-[var(--text-secondary)] ${mono}`}>
                  {s.uptime24h != null && <span title="Disponibilidad en las últimas 24 horas">{pct(s.uptime24h)} 24 h</span>}
                  {s.pingMs != null && s.status === 'up' && <span>{s.pingMs} ms</span>}
                  <Chip tone={st.tone}>{st.label}</Chip>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5! border-t border-[var(--border)] pt-4!">
        {isError(cert) ? (
          <SectionError message={cert.error} />
        ) : !cert.configured ? null : 'error' in cert ? (
          <SectionError message={`Certificado del panel: ${cert.error}`} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {certTone(cert.daysRemaining) === 'ok' ? (
                <ShieldCheck className="h-5 w-5 text-[var(--primary)]" aria-hidden />
              ) : (
                <ShieldAlert className={`h-5 w-5 ${toneText[certTone(cert.daysRemaining)]}`} aria-hidden />
              )}
              <div>
                <p className="text-sm font-bold">Certificado del servidor</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {cert.issuer ?? 'Emisor desconocido'} · vence {formatDateTime(cert.validTo)}
                </p>
              </div>
            </div>
            <Chip tone={certTone(cert.daysRemaining)}>
              {cert.daysRemaining == null ? 'Sin datos' : cert.daysRemaining < 0 ? 'Vencido' : `${cert.daysRemaining} días`}
            </Chip>
          </div>
        )}
      </div>
    </Card>
  );
}

// ---------- backups ----------

function backupState(b: Backups, now: number): { label: string; tone: Tone } {
  if (b.status === 'down') return { label: 'Falló', tone: 'crit' };
  const last = b.lastSuccessAt ? new Date(b.lastSuccessAt).getTime() : 0;
  if (!last) return { label: 'Sin datos', tone: 'muted' };
  if (now - last > LIMITS.backupStaleHours * 3_600_000) return { label: 'Atrasado', tone: 'warn' };
  return { label: 'Al día', tone: 'ok' };
}

function BackupsCard({ data, now }: { data: Backups | { error: string }; now: number }) {
  if (isError(data)) {
    return (
      <Card title="Backups" icon={Archive}>
        <SectionError message={data.error} />
      </Card>
    );
  }
  const st = backupState(data, now);
  const lastWeekly = data.weekly[0];
  return (
    <Card title="Backups" icon={Archive} action={<Chip tone={st.tone}>{st.label}</Chip>}>
      {data.status === 'down' && data.lastMessage && <div className="mb-4!"><SectionError message={data.lastMessage} /></div>}
      <dl className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        {[
          ['Último backup', formatRelative(data.lastSuccessAt, now), formatDateTime(data.lastSuccessAt)],
          ['Próximo', formatRelative(data.nextRunAt, now), formatDateTime(data.nextRunAt)],
          ['Servidores de juego', lastWeekly ? formatBytes(lastWeekly.bytes) : '—', lastWeekly ? `copia del ${formatDateTime(lastWeekly.modifiedAt)}` : 'Se copian los domingos'],
          ['Espacio usado', formatBytes(data.totalBytes), `${data.daily.length} diarios · ${data.weekly.length} semanales`],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-xl bg-[var(--bg-darker)]/60 p-3.5!">
            <dt className="text-xs font-bold tracking-wide text-[var(--text-muted)] uppercase">{label}</dt>
            <dd className={`mt-1! text-lg font-bold ${mono}`}>{value}</dd>
            <dd className="text-xs text-[var(--text-muted)]">{detail}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4! flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        {data.driveOk ? <Cloud className="h-4 w-4 text-[var(--primary)]" aria-hidden /> : <CloudOff className="h-4 w-4 text-[var(--accent)]" aria-hidden />}
        {data.driveOk ? 'Copia cifrada en Google Drive al día' : 'El último backup no subió a Google Drive'}
      </p>
    </Card>
  );
}

// ---------- resumen de problemas ----------

function findProblems(data: Overview, now: number): string[] {
  const problems: string[] = [];
  for (const value of Object.values(data)) {
    if (isError(value)) problems.push(value.error);
  }
  if (!isError(data.nodes)) {
    for (const n of data.nodes) {
      const stale = !n.updatedAt || now - new Date(n.updatedAt).getTime() > LIMITS.nodeStaleMinutes * 60_000;
      if (n.status === 'down' || (n.status === 'up' && stale)) problems.push(`${n.name}: sin conexión con el monitor`);
      if ((n.cpuTemp ?? 0) >= LIMITS.tempWarn) problems.push(`${n.name}: temperatura alta (${Math.round(n.cpuTemp!)} °C)`);
      for (const d of n.disks) if ((d.pct ?? 0) >= LIMITS.diskWarn) problems.push(`${n.name}: disco ${d.label} al ${Math.round(d.pct!)} %`);
      for (const c of n.containers) if (c.health === 'unhealthy') problems.push(`${n.name}: el contenedor ${c.name} tiene problemas`);
    }
  }
  if (!isError(data.services)) {
    for (const s of data.services) if (s.status === 'down') problems.push(`${s.name} está caído`);
  }
  if (!isError(data.backups)) {
    const st = backupState(data.backups, now);
    if (st.tone === 'crit') problems.push('El último backup falló');
    if (st.tone === 'warn') problems.push('El backup diario está atrasado');
  }
  if (!isError(data.originCert) && data.originCert.configured && !('error' in data.originCert)) {
    const days = data.originCert.daysRemaining;
    if (days != null && days <= LIMITS.certWarnDays) problems.push(`El certificado del servidor vence en ${days} días`);
  }
  return problems;
}

// ---------- página ----------

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: Overview; fetchedAt: number; offlineSince?: number; error?: string }
  | { kind: 'failed'; error: string; offline: boolean; status: number };

export default function Dashboard() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store', redirect: 'manual' });
      // Cuando vence la sesión, Access responde con una redirección a su login.
      if (res.type === 'opaqueredirect') {
        const error = 'Tu sesión de Cloudflare Access venció. Recargá la página para volver a entrar.';
        setState((prev) =>
          prev.kind === 'ready' ? { ...prev, error } : { kind: 'failed', error, offline: false, status: 401 },
        );
        return;
      }
      const body = await res.json().catch(() => ({ error: 'Respuesta inválida del servidor.' }));
      if (res.ok) {
        setState({ kind: 'ready', data: body as Overview, fetchedAt: Date.now() });
      } else {
        const error = (body as { error?: string }).error ?? `Error ${res.status}`;
        const offline = Boolean((body as { offline?: boolean }).offline);
        // Si ya había datos, se mantienen a la vista y se avisa arriba.
        setState((prev) =>
          prev.kind === 'ready'
            ? { ...prev, error, offlineSince: offline ? prev.offlineSince ?? Date.now() : undefined }
            : { kind: 'failed', error, offline, status: res.status },
        );
      }
    } catch {
      setState((prev) =>
        prev.kind === 'ready'
          ? { ...prev, error: 'No hay conexión a internet.' }
          : { kind: 'failed', error: 'No hay conexión a internet.', offline: false, status: 0 },
      );
    } finally {
      setRefreshing(false);
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
      else setNow(Date.now());
    }, REFRESH_MS);
    const onVisible = () => !document.hidden && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const problems = useMemo(() => (state.kind === 'ready' ? findProblems(state.data, now) : []), [state, now]);

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)]">
      <div className="mx-auto! flex max-w-6xl flex-col gap-6 px-4! py-8! sm:px-6! sm:py-12!">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`text-xs font-bold tracking-[0.25em] text-[var(--primary)] uppercase ${mono}`}>thesortty.dev · privado</p>
            <h1 className="mt-1! text-3xl font-extrabold text-balance sm:text-4xl">Centro de control</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Accesos">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3! py-2! text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
              >
                {l.label} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ))}
            <button
              type="button"
              onClick={load}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3! py-2! text-sm font-bold text-[var(--bg-darker)] transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden />
              Actualizar
            </button>
          </nav>
        </header>

        {state.kind === 'loading' && (
          <p className="flex items-center gap-2 py-24! text-[var(--text-muted)]" role="status">
            <LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden /> Consultando el servidor…
          </p>
        )}

        {state.kind === 'failed' && (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8!">
            {state.status === 403 || state.status === 401 ? <Lock className="h-7 w-7 text-[var(--accent)]" aria-hidden /> : <CloudOff className="h-7 w-7 text-[#F87171]" aria-hidden />}
            <h2 className="text-xl font-bold">
              {state.offline ? 'El servidor no responde' : state.status === 401 ? 'Sesión vencida' : state.status === 403 ? 'Sin acceso' : 'No se pudo cargar el estado'}
            </h2>
            <p className="max-w-prose text-[var(--text-secondary)]">
              {state.offline
                ? 'La PC puede estar apagada o sin internet. Si se cortó la luz, va a volver sola cuando se prenda.'
                : state.error}
            </p>
            <button
              type="button"
              onClick={state.status === 401 ? () => window.location.reload() : load}
              className="mt-2! rounded-lg border border-[var(--border)] px-4! py-2! text-sm hover:border-[var(--primary)]"
            >
              {state.status === 401 ? 'Volver a entrar' : 'Reintentar'}
            </button>
          </div>
        )}

        {state.kind === 'ready' && (
          <>
            <div
              className={`flex flex-wrap items-start gap-3 rounded-2xl border px-5! py-4! ${
                state.error ? toneChip.crit : problems.length ? toneChip.warn : toneChip.ok
              }`}
              role="status"
            >
              {state.error || problems.length ? <CircleAlert className="mt-0.5! h-5 w-5 shrink-0" aria-hidden /> : <CircleCheck className="mt-0.5! h-5 w-5 shrink-0" aria-hidden />}
              <div className="min-w-0 flex-1">
                {state.error ? (
                  <p className="font-bold">
                    {state.offlineSince ? `El servidor no responde desde ${formatRelative(new Date(state.offlineSince).toISOString(), now)}. ` : `${state.error} `}
                    <span className="font-normal">Estos son los últimos datos recibidos ({formatDateTime(state.data.generatedAt)})</span>
                  </p>
                ) : problems.length ? (
                  <>
                    <p className="font-bold">{problems.length === 1 ? 'Hay 1 cosa para revisar' : `Hay ${problems.length} cosas para revisar`}</p>
                    <ul className="mt-1! list-inside list-disc text-sm text-[var(--text-secondary)]">
                      {problems.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </>
                ) : (
                  <p className="font-bold">Todo funcionando</p>
                )}
              </div>
              <span className="text-xs text-[var(--text-muted)]">Actualizado {formatRelative(new Date(state.fetchedAt).toISOString(), now)}</span>
            </div>

            <Card title="Equipos" icon={Server} className={state.error ? 'opacity-60' : ''}>
              {isError(state.data.nodes) ? (
                <SectionError message={state.data.nodes.error} />
              ) : state.data.nodes.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Todavía no hay equipos agregados en Beszel.</p>
              ) : (
                <div className={`grid grid-cols-1 gap-4 ${state.data.nodes.length > 1 ? 'xl:grid-cols-2' : ''}`}>
                  {state.data.nodes.map((n) => <NodeCard key={n.id} node={n} now={now} />)}
                </div>
              )}
            </Card>

            <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 ${state.error ? 'opacity-60' : ''}`}>
              <GameServersCard data={state.data.gameServers} />
              <BackupsCard data={state.data.backups} now={now} />
              <ServicesCard services={state.data.services} cert={state.data.originCert} now={now} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
