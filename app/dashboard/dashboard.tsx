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
import './dashboard.css';

const REFRESH_MS = 30_000;

const LINKS = [
  { label: 'Panel', href: 'https://panel.thesortty.dev' },
  { label: 'Kuma', href: 'https://kuma.thesortty.dev' },
];

// ---------- piezas visuales ----------

const t = (tone: Tone) => `t-${tone}`;

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`d-chip ${t(tone)}`}>{children}</span>;
}

function Card({ title, icon: Icon, action, children, className = '' }: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`d-card ${className}`}>
      <header className="d-card-head">
        <h2>
          <Icon aria-hidden />
          {title}
        </h2>
        {action}
      </header>
      <div className="d-card-body">{children}</div>
    </section>
  );
}

function Bar({ value, tone }: { value: number | null; tone: Tone }) {
  return (
    <div className={`d-bar ${t(tone)}`} role="presentation">
      <span style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }} />
    </div>
  );
}

function Sparkline({ points, field, max, tone, unit }: {
  points: HistoryPoint[];
  field: 'cpu' | 'temp' | 'mem';
  max: number;
  tone: Tone;
  unit: string;
}) {
  const values = points.map((p) => p[field]).filter((v): v is number => v != null);
  if (values.length < 2) return null;
  const w = 120;
  const h = 36;
  const step = w / (values.length - 1);
  const y = (v: number) => h - 3 - (Math.min(v, max) / max) * (h - 6);
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const peak = Math.max(...values);
  const label = `Última hora: mínimo ${Math.round(Math.min(...values))}${unit}, máximo ${Math.round(peak)}${unit}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className={`d-spark ${t(tone)}`} preserveAspectRatio="none" role="img" aria-label={label}>
        <title>{label}</title>
        <line x1="0" x2={w} y1={h / 2} y2={h / 2} stroke="currentColor" opacity="0.12" vectorEffect="non-scaling-stroke" />
        <path d={`${line} L${w},${h} L0,${h} Z`} fill="currentColor" opacity="0.1" />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="d-spark-cap">
        <span>última hora</span>
        <span className="num">máx {Math.round(peak)}{unit}</span>
      </div>
    </div>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <p className="d-error">
      <CircleAlert aria-hidden /> {message}
    </p>
  );
}

// ---------- equipos ----------

function Metric({ icon: Icon, label, value, unit, detail, tone, bar, spark }: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  tone: Tone;
  bar?: number | null;
  spark?: React.ReactNode;
}) {
  return (
    <div className="d-metric">
      <span className="d-label">
        <Icon aria-hidden /> {label}
      </span>
      <div className="d-value-row">
        <span className="d-value num">
          {value}
          {unit && value !== '—' && <small>{unit}</small>}
        </span>
        {(tone === 'warn' || tone === 'crit') && <span className={`d-flag ${t(tone)}`}>{tone === 'crit' ? 'Alto' : 'Elevado'}</span>}
      </div>
      {detail && <span className="d-detail">{detail}</span>}
      {bar !== undefined && <Bar value={bar} tone={tone} />}
      {spark}
    </div>
  );
}

const num = (n: number | null | undefined, digits = 1) =>
  n == null ? '—' : n.toLocaleString('es-AR', { maximumFractionDigits: digits });

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
    <article className="d-node">
      <div className="d-node-head">
        <div className="d-node-name">
          <h3 className="mono">{node.name}</h3>
          <Chip tone={statusTone}>{statusLabel}</Chip>
        </div>
        <span className="d-meta">
          Encendida hace {formatDuration(node.uptimeSec)} · datos {formatRelative(node.updatedAt, now)}
        </span>
      </div>

      <div className={statusTone === 'ok' ? '' : 'd-dim'} title={statusTone === 'ok' ? undefined : 'Últimos datos recibidos'}>
        <div className="d-metrics">
          <Metric
            icon={Thermometer}
            label="Temperatura"
            value={node.cpuTemp == null ? '—' : String(Math.round(node.cpuTemp))}
            unit="°C"
            detail={`Alerta desde ${LIMITS.tempWarn} °C`}
            tone={tempTone}
            spark={<Sparkline points={node.history} field="temp" max={100} tone={tempTone} unit=" °C" />}
          />
          <Metric
            icon={Cpu}
            label="Procesador"
            value={num(node.cpuPct)}
            unit="%"
            detail={node.load ? `Carga ${node.load.map((l) => num(l, 2)).join(' · ')}` : undefined}
            tone={cpuTone}
            spark={<Sparkline points={node.history} field="cpu" max={100} tone={cpuTone} unit=" %" />}
          />
          <Metric
            icon={MemoryStick}
            label="Memoria"
            value={num(node.memPct)}
            unit="%"
            detail={`${num(node.memUsedGB)} de ${num(node.memTotalGB)} GB`}
            tone={memTone}
            bar={node.memPct}
          />
        </div>

        <div className="d-disks">
          {node.disks.map((d) => {
            const tone = toneFor(d.pct, LIMITS.diskWarn, LIMITS.diskCrit);
            return (
              <div key={d.key} className="d-disk">
                <div className="d-disk-row">
                  <span className="d-label">
                    <HardDrive aria-hidden /> {d.label}
                  </span>
                  <span className={`num ${t(tone)}`}>
                    {formatGB(d.usedGB)} de {formatGB(d.totalGB)} · {pct(d.pct)}
                  </span>
                </div>
                <Bar value={d.pct} tone={tone} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="d-node-foot">
        <span className="d-net num">
          <span><ArrowUp aria-label="Subida" />{formatRate(node.net?.upBps)}</span>
          <span><ArrowDown aria-label="Bajada" />{formatRate(node.net?.downBps)}</span>
        </span>
        <button type="button" className="d-link-btn" onClick={() => setShowContainers((v) => !v)} aria-expanded={showContainers}>
          <Box aria-hidden />
          {node.containers.length} contenedores
          {unhealthy > 0 && <span className="t-crit"> · {unhealthy} con problemas</span>}
          {showContainers ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
        </button>
      </div>

      {showContainers && (
        <div className="d-containers">
          <ul className="d-list">
            {node.containers.map((c) => (
              <li key={c.name}>
                <span className="d-cname">
                  <span className={`d-dot ${t(c.health === 'unhealthy' ? 'crit' : c.status.startsWith('Up') ? 'ok' : 'muted')}`} aria-hidden />
                  <span className="mono">{c.name}</span>
                </span>
                <span className="d-right num">
                  <span>{c.memMB ?? '—'} MB</span>
                  <span>CPU {pct(c.cpuPct)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
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
        <p className="d-empty">Falta conectar Pterodactyl: creá un usuario para el dashboard y cargá su clave de API en el servidor.</p>
      ) : data.servers.length === 0 ? (
        <p className="d-empty">El usuario del dashboard no tiene servidores asignados.</p>
      ) : (
        <ul className="d-list">
          {data.servers.map((s) => {
            const st = GAME_STATE[s.state] ?? GAME_STATE.unknown;
            return (
              <li key={s.id}>
                <div style={{ minWidth: 0 }}>
                  <p className="d-name">{s.name}</p>
                  <p className="d-meta mono">
                    {s.node}{s.port ? ` · puerto ${s.port}` : ''}
                    {s.state === 'running' && ` · ${formatDuration((s.uptimeMs ?? 0) / 1000)}`}
                  </p>
                </div>
                <div className="d-right num">
                  {s.state === 'running' && (
                    <span>
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
    <Card title="Servicios" icon={Activity} className="d-span">
      {isError(services) ? (
        <SectionError message={services.error} />
      ) : services.length === 0 ? (
        <p className="d-empty">No hay monitores en Uptime Kuma.</p>
      ) : (
        <ul className="d-list">
          {services.map((s) => {
            const st = SERVICE_STATE[s.status] ?? SERVICE_STATE.unknown;
            return (
              <li key={s.id}>
                <div style={{ minWidth: 0 }}>
                  <p className="d-name">{s.name}</p>
                  <p className="d-meta" title={s.message ?? undefined}>
                    {s.status === 'down' && s.message
                      ? s.message
                      : s.status === 'paused'
                        ? 'En pausa en Uptime Kuma'
                        : `Revisado ${formatRelative(s.checkedAt, now)}`}
                  </p>
                </div>
                <div className="d-right num">
                  {s.uptime24h != null && <span title="Disponibilidad en las últimas 24 horas">{pct(s.uptime24h)} en 24 h</span>}
                  {s.pingMs != null && s.status === 'up' && <span>{s.pingMs} ms</span>}
                  <Chip tone={st.tone}>{st.label}</Chip>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isError(cert) ? (
        <div className="d-cert"><SectionError message={cert.error} /></div>
      ) : !cert.configured ? null : 'error' in cert ? (
        <div className="d-cert"><SectionError message={`Certificado del panel: ${cert.error}`} /></div>
      ) : (
        <div className="d-cert">
          <div className={`d-cert-info ${t(certTone(cert.daysRemaining))}`}>
            {certTone(cert.daysRemaining) === 'ok' ? <ShieldCheck aria-hidden /> : <ShieldAlert aria-hidden />}
            <div>
              <p className="d-name">Certificado del servidor</p>
              <p className="d-meta">
                {cert.issuer ?? 'Emisor desconocido'} · vence {formatDateTime(cert.validTo)}
              </p>
            </div>
          </div>
          <Chip tone={certTone(cert.daysRemaining)}>
            {cert.daysRemaining == null ? 'Sin datos' : cert.daysRemaining < 0 ? 'Vencido' : `${cert.daysRemaining} días`}
          </Chip>
        </div>
      )}
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
      {data.status === 'down' && data.lastMessage && <div style={{ marginBottom: 16 }}><SectionError message={data.lastMessage} /></div>}
      <dl className="d-facts">
        {[
          ['Último', formatRelative(data.lastSuccessAt, now), formatDateTime(data.lastSuccessAt)],
          ['Próximo', formatRelative(data.nextRunAt, now), formatDateTime(data.nextRunAt)],
          ['Servidores de juego', lastWeekly ? formatBytes(lastWeekly.bytes) : '—', lastWeekly ? `copia del ${formatDateTime(lastWeekly.modifiedAt)}` : 'Se copian los domingos'],
          ['Espacio usado', formatBytes(data.totalBytes), `${data.daily.length} diarios · ${data.weekly.length} semanales`],
        ].map(([label, value, detail]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <dt>{label}</dt>
            <dd className="d-fact-value num">{value}</dd>
            <dd className="d-fact-detail">{detail}</dd>
          </div>
        ))}
      </dl>
      <p className={`d-note ${t(data.driveOk ? 'ok' : 'warn')}`}>
        {data.driveOk ? <Cloud aria-hidden /> : <CloudOff aria-hidden />}
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

export default function Dashboard({ fontClassName = '' }: { fontClassName?: string }) {
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
  const summaryTone: Tone = state.kind !== 'ready' ? 'muted' : state.error ? 'crit' : problems.length ? 'warn' : 'ok';

  return (
    <main className={`dash ${fontClassName}`}>
      <div className="dash-wrap">
        <header className="d-top">
          <div>
            <h1>Centro de control</h1>
            <p className="d-sub">
              thesortty.dev
              {state.kind === 'ready' && ` · actualizado ${formatRelative(new Date(state.fetchedAt).toISOString(), now)}`}
            </p>
          </div>
          <nav className="d-actions" aria-label="Accesos">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="d-btn">
                {l.label} <ExternalLink aria-hidden />
              </a>
            ))}
            <button type="button" onClick={load} disabled={refreshing} className="d-btn">
              <RefreshCw className={refreshing ? 'd-spin' : ''} aria-hidden />
              Actualizar
            </button>
          </nav>
        </header>

        {state.kind === 'loading' && (
          <p className="d-loading" role="status">
            <LoaderCircle className="d-spin" aria-hidden /> Consultando el servidor…
          </p>
        )}

        {state.kind === 'failed' && (
          <div className={`d-card d-fail ${t(state.offline || state.status === 0 ? 'crit' : 'warn')}`}>
            {state.status === 403 || state.status === 401 ? <Lock aria-hidden /> : <CloudOff aria-hidden />}
            <h2>
              {state.offline ? 'El servidor no responde' : state.status === 401 ? 'Sesión vencida' : state.status === 403 ? 'Sin acceso' : 'No se pudo cargar el estado'}
            </h2>
            <p>
              {state.offline
                ? 'La PC puede estar apagada o sin internet. Si se cortó la luz, va a volver sola cuando se prenda.'
                : state.error}
            </p>
            <button type="button" className="d-btn" onClick={state.status === 401 ? () => window.location.reload() : load}>
              {state.status === 401 ? 'Volver a entrar' : 'Reintentar'}
            </button>
          </div>
        )}

        {state.kind === 'ready' && (
          <>
            <div className={`d-summary ${t(summaryTone)}`} role="status">
              {summaryTone === 'ok' ? <CircleCheck aria-hidden /> : <CircleAlert aria-hidden />}
              <div className="d-summary-body">
                {state.error ? (
                  <p>
                    <strong>
                      {state.offlineSince ? `El servidor no responde desde ${formatRelative(new Date(state.offlineSince).toISOString(), now)}.` : state.error}
                    </strong>{' '}
                    Estos son los últimos datos recibidos ({formatDateTime(state.data.generatedAt)}).
                  </p>
                ) : problems.length ? (
                  <>
                    <strong>{problems.length === 1 ? 'Hay 1 cosa para revisar' : `Hay ${problems.length} cosas para revisar`}</strong>
                    <ul>
                      {problems.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </>
                ) : (
                  <strong>Todo funcionando</strong>
                )}
              </div>
            </div>

            <div className={`d-grid ${state.error ? 'd-dim' : ''}`}>
              <Card title="Equipos" icon={Server} className="d-span">
                {isError(state.data.nodes) ? (
                  <SectionError message={state.data.nodes.error} />
                ) : state.data.nodes.length === 0 ? (
                  <p className="d-empty">Todavía no hay equipos agregados en Beszel.</p>
                ) : (
                  state.data.nodes.map((n) => <NodeCard key={n.id} node={n} now={now} />)
                )}
              </Card>
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
