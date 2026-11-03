'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Box,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CloudOff,
  ExternalLink,
  Gamepad2,
  HardDrive,
  House,
  LoaderCircle,
  Lock,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Activity,
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
import { CloudVault, GrassBlock, PcTower, Router } from './art';
import { NotifyControl } from './notify';
import './dashboard.css';

const REFRESH_MS = 30_000;
const TZ = 'America/Argentina/Buenos_Aires';
const OWNER = 'Gonzalo';

const t = (tone: Tone) => `t-${tone}`;
const num = (n: number | null | undefined, digits = 1) =>
  n == null ? '—' : n.toLocaleString('es-AR', { maximumFractionDigits: digits });

// ---------- piezas ----------

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`d-chip ${t(tone)}`}>{children}</span>;
}

function Tile({ id, area, title, sub, action, dim, children }: {
  id?: string;
  area: string;
  title: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  dim?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`d-tile d-glass ${area} ${dim ? 'd-tile-dim' : ''}`} aria-label={title}>
      <header className="d-tile-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="d-tile-title">{title}</h2>
          {sub && <p className="d-tile-sub">{sub}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Bar({ value, tone, accent }: { value: number | null; tone: Tone; accent?: boolean }) {
  return (
    <div className={`d-bar ${t(tone)} ${accent ? 'd-is-accent' : ''}`} role="presentation">
      <span style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }} />
    </div>
  );
}

function Sparkline({ points, field, tone, unit }: { points: HistoryPoint[]; field: 'cpu' | 'temp' | 'mem'; tone: Tone; unit: string }) {
  const values = points.map((p) => p[field]).filter((v): v is number => v != null);
  if (values.length < 2) return null;
  const w = 160;
  const h = 44;
  const max = Math.max(100, ...values);
  const step = w / (values.length - 1);
  const y = (v: number) => h - 3 - (v / max) * (h - 6);
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const peak = Math.max(...values);
  const label = `Última hora: mínimo ${Math.round(Math.min(...values))}${unit}, máximo ${Math.round(peak)}${unit}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className={`d-spark ${t(tone)}`} preserveAspectRatio="none" role="img" aria-label={label}>
        <title>{label}</title>
        <path d={`${line} L${w},${h} L0,${h} Z`} fill="currentColor" opacity="0.12" />
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

function nodeHealth(node: ServerNode, now: number): { tone: Tone; label: string } {
  const stale = !node.updatedAt || now - new Date(node.updatedAt).getTime() > LIMITS.nodeStaleMinutes * 60_000;
  if (node.status === 'paused') return { tone: 'muted', label: 'En pausa' };
  if (node.status !== 'up') return { tone: 'crit', label: 'Desconectada' };
  if (stale) return { tone: 'crit', label: 'Sin datos recientes' };
  return { tone: 'ok', label: 'En línea' };
}

// ---------- equipo ----------

function NodeTile({ node, now }: { node: ServerNode; now: number }) {
  const [open, setOpen] = useState(false);
  const health = nodeHealth(node, now);
  const cpuTone = toneFor(node.cpuPct, LIMITS.cpuWarn, LIMITS.cpuCrit);
  const memTone = toneFor(node.memPct, LIMITS.memWarn, LIMITS.memCrit);
  const unhealthy = node.containers.filter((c) => c.health === 'unhealthy').length;

  return (
    <Tile
      id="equipo"
      area="a-node"
      title={node.name}
      sub={`Encendida hace ${formatDuration(node.uptimeSec)}, datos ${formatRelative(node.updatedAt, now)}`}
      action={<Chip tone={health.tone}>{health.label}</Chip>}
    >
      <div className={`d-node-body ${health.tone === 'ok' ? '' : 'd-tile-dim'}`}>
        <PcTower className={`d-node-art ${t(health.tone)}`} />
        <div className="d-node-stats">
          <div style={{ gridColumn: '1 / -1' }}>
            <p className="d-stat-label">Procesador</p>
            <p className="d-stat-value num">
              {num(node.cpuPct)}<small>%</small>
              {(cpuTone === 'warn' || cpuTone === 'crit') && <span className={`d-stat-flag ${t(cpuTone)}`}>{cpuTone === 'crit' ? 'Al límite' : 'Exigido'}</span>}
            </p>
            <Sparkline points={node.history} field="cpu" tone={cpuTone} unit=" %" />
          </div>
          <div>
            <p className="d-stat-label">Memoria</p>
            <p className="d-stat-value num">{num(node.memPct)}<small>%</small></p>
            <p className="d-stat-detail num">{num(node.memUsedGB)} de {num(node.memTotalGB)} GB</p>
            <div style={{ marginTop: 6 }}><Bar value={node.memPct} tone={memTone} /></div>
          </div>
          <div>
            <p className="d-stat-label">Carga promedio</p>
            <p className="d-stat-value num">{node.load ? num(node.load[0], 2) : '—'}</p>
            <p className="d-stat-detail num">{node.load ? `5 min ${num(node.load[1], 2)}, 15 min ${num(node.load[2], 2)}` : 'Sin datos'}</p>
          </div>
        </div>
      </div>

      <div className="d-node-foot">
        <span className="d-tile-sub">{node.threads ? `${node.threads} hilos de CPU` : ''}</span>
        <button type="button" className="d-text-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <Box aria-hidden />
          <span>
            {node.containers.length} contenedores
            {unhealthy > 0 && <span style={{ color: 'var(--d-crit)' }}>, {unhealthy} con problemas</span>}
          </span>
          {open ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
        </button>
      </div>

      {open && (
        <ul className="d-containers">
          {node.containers.map((c) => (
            <li key={c.name}>
              <span className="c-name">
                <span className={`d-dot ${t(c.health === 'unhealthy' ? 'crit' : c.status.startsWith('Up') ? 'ok' : 'muted')}`} aria-hidden />
                {c.name}
              </span>
              <span className="c-use num">{c.memMB ?? '—'} MB, CPU {pct(c.cpuPct)}</span>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

// Medidor de 240°, de 0 a 100 °C, como el dial de un aire acondicionado.
const GAUGE = { cx: 100, cy: 100, r: 80, start: 150, sweep: 240 };
const polar = (deg: number, r = GAUGE.r) => {
  const a = (deg * Math.PI) / 180;
  return [GAUGE.cx + r * Math.cos(a), GAUGE.cy + r * Math.sin(a)] as const;
};

function TempTile({ node }: { node: ServerNode }) {
  const temp = node.cpuTemp;
  const tone = toneFor(temp, LIMITS.tempWarn, LIMITS.tempCrit);
  const frac = Math.min(1, Math.max(0, (temp ?? 0) / 100));
  const [sx, sy] = polar(GAUGE.start);
  const [ex, ey] = polar(GAUGE.start + GAUGE.sweep);
  const arc = `M${sx.toFixed(1)} ${sy.toFixed(1)} A${GAUGE.r} ${GAUGE.r} 0 1 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  const length = (2 * Math.PI * GAUGE.r * GAUGE.sweep) / 360;
  const [kx, ky] = polar(GAUGE.start + GAUGE.sweep * frac);
  const [wx1, wy1] = polar(GAUGE.start + GAUGE.sweep * (LIMITS.tempWarn / 100), GAUGE.r - 14);
  const [wx2, wy2] = polar(GAUGE.start + GAUGE.sweep * (LIMITS.tempWarn / 100), GAUGE.r - 22);
  const temps = node.history.map((p) => p.temp).filter((v): v is number => v != null);

  return (
    <Tile area="a-temp" title="Temperatura" sub="Procesador">
      <div className={`d-gauge ${t(tone)}`}>
        <svg viewBox="0 0 200 172" role="img" aria-label={temp == null ? 'Sin datos de temperatura' : `${Math.round(temp)} grados`}>
          {Array.from({ length: 41 }, (_, i) => {
            const deg = GAUGE.start + (GAUGE.sweep * i) / 40;
            const [x1, y1] = polar(deg, GAUGE.r - 14);
            const [x2, y2] = polar(deg, GAUGE.r - (i % 5 === 0 ? 22 : 18));
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--d-text-3)" strokeOpacity={i % 5 === 0 ? 0.7 : 0.35} strokeWidth="1.2" />;
          })}
          <line x1={wx1} y1={wy1} x2={wx2} y2={wy2} stroke="var(--d-warn)" strokeWidth="2.5" strokeLinecap="round" />
          <path d={arc} fill="none" stroke="var(--d-track)" strokeWidth="12" strokeLinecap="round" />
          {temp != null && (
            <>
              <path d={arc} fill="none" className="d-gauge-arc" strokeWidth="12" strokeLinecap="round" strokeDasharray={length} strokeDashoffset={length * (1 - frac)} />
              <circle cx={kx} cy={ky} r="9" className="d-gauge-knob" />
            </>
          )}
        </svg>
        <div className="d-gauge-read">
          <span className="d-gauge-value num">{temp == null ? '—' : `${Math.round(temp)}°`}</span>
          <span className="d-gauge-unit">{tone === 'crit' ? 'Muy caliente' : tone === 'warn' ? 'Caliente' : 'grados Celsius'}</span>
        </div>
      </div>
      <div className="d-mini-row num">
        <div><b>{temps.length ? `${Math.round(Math.min(...temps))}°` : '—'}</b><span>mínima</span></div>
        <div><b>{temps.length ? `${Math.round(Math.max(...temps))}°` : '—'}</b><span>máxima</span></div>
        <div><b>{LIMITS.tempWarn}°</b><span>alerta</span></div>
      </div>
    </Tile>
  );
}

function NetTile({ node }: { node: ServerNode }) {
  return (
    <Tile area="a-net" title="Red" sub={`Tráfico de ${node.name}`}>
      <Router className="d-net-art t-ok" />
      <div className="d-net-rows num">
        <div><span className="d-tile-sub"><ArrowUp aria-hidden />Subida</span><b>{formatRate(node.net?.upBps)}</b></div>
        <div><span className="d-tile-sub"><ArrowDown aria-hidden />Bajada</span><b>{formatRate(node.net?.downBps)}</b></div>
      </div>
    </Tile>
  );
}

function DisksTile({ node }: { node: ServerNode }) {
  const used = node.disks.reduce((a, d) => a + (d.usedGB ?? 0), 0);
  const total = node.disks.reduce((a, d) => a + (d.totalGB ?? 0), 0);
  return (
    <Tile area="a-disk" title="Almacenamiento" sub={`${formatGB(used)} usados de ${formatGB(total)}`}>
      <div className="d-disks">
        {node.disks.map((d) => {
          const tone = toneFor(d.pct, LIMITS.diskWarn, LIMITS.diskCrit);
          return (
            <div key={d.key} className="d-disk">
              <span className="d-disk-name"><HardDrive aria-hidden /> {d.label}</span>
              <span className={`d-stat-value num ${t(tone)}`}>{num(d.pct, 0)}<small>%</small></span>
              <Bar value={d.pct} tone={tone} />
              <span className="d-disk-use num">{formatGB(d.usedGB)} de {formatGB(d.totalGB)}</span>
            </div>
          );
        })}
      </div>
    </Tile>
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

function GamesTile({ data }: { data: GameServers | { error: string } }) {
  const servers = !isError(data) && data.configured ? data.servers : [];
  const running = servers.filter((s) => s.state === 'running').length;
  return (
    <Tile
      id="juegos"
      area="a-game"
      title="Servidores de juego"
      sub={servers.length ? `${running} encendidos de ${servers.length}` : 'Desde Pterodactyl'}
    >
      {isError(data) ? (
        <SectionError message={data.error} />
      ) : !data.configured ? (
        <div className="d-games-empty">
          <GrassBlock className="d-game-art" />
          <p className="d-empty">
            Para verlos acá, creá en Pterodactyl un usuario para el dashboard, sumalo a cada servidor y cargá su clave de API en el servidor.
          </p>
        </div>
      ) : servers.length === 0 ? (
        <div className="d-games-empty">
          <GrassBlock className="d-game-art" />
          <p className="d-empty">El usuario del dashboard todavía no tiene servidores asignados.</p>
        </div>
      ) : (
        <div className="d-games">
          {servers.map((s) => {
            const st = GAME_STATE[s.state] ?? GAME_STATE.unknown;
            const memPct = s.memBytes && s.limits.memMB ? (s.memBytes / (s.limits.memMB * 1024 * 1024)) * 100 : null;
            return (
              <article key={s.id} className={`d-game ${s.state === 'running' ? '' : 'd-is-off'}`}>
                <div className="d-game-top">
                  <GrassBlock className="d-game-art" />
                  <Chip tone={st.tone}>{st.label}</Chip>
                </div>
                <div>
                  <p className="d-game-name">{s.name}</p>
                  <p className="d-game-meta num">
                    {s.port ? `Puerto ${s.port}` : s.node}
                    {s.state === 'running' && `, hace ${formatDuration((s.uptimeMs ?? 0) / 1000)}`}
                  </p>
                </div>
                {s.state === 'running' && (
                  <div>
                    <p className="d-game-meta num">
                      {formatBytes(s.memBytes)}{s.limits.memMB ? ` de ${formatBytes(s.limits.memMB * 1024 * 1024)}` : ''}, CPU {pct(s.cpuPct)}
                    </p>
                    {memPct != null && <div style={{ marginTop: 6 }}><Bar value={memPct} tone="ok" accent /></div>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </Tile>
  );
}

// ---------- servicios ----------

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

function ServicesTile({ services, cert, now }: { services: Service[] | { error: string }; cert: OriginCert | { error: string }; now: number }) {
  return (
    <Tile id="servicios" area="a-svc" title="Servicios" sub="Revisados por Uptime Kuma">
      {isError(services) ? (
        <SectionError message={services.error} />
      ) : (
        <ul className="d-svc-list">
          {services.length === 0 && <li className="d-empty">No hay monitores en Uptime Kuma.</li>}
          {services.map((s) => {
            const st = SERVICE_STATE[s.status] ?? SERVICE_STATE.unknown;
            return (
              <li key={s.id}>
                <div style={{ minWidth: 0 }}>
                  <p className="d-svc-name">{s.name}</p>
                  <p className="d-svc-meta num">
                    {s.status === 'down' && s.message
                      ? s.message
                      : s.status === 'paused'
                        ? 'En pausa en Uptime Kuma'
                        : [s.uptime24h != null && `${pct(s.uptime24h)} en 24 h`, s.pingMs != null && `${s.pingMs} ms`].filter(Boolean).join(', ') ||
                          `Revisado ${formatRelative(s.checkedAt, now)}`}
                  </p>
                </div>
                <Chip tone={st.tone}>{st.label}</Chip>
              </li>
            );
          })}
          {isError(cert) ? (
            <li><SectionError message={cert.error} /></li>
          ) : !cert.configured ? null : 'error' in cert ? (
            <li><SectionError message={`Certificado: ${cert.error}`} /></li>
          ) : (
            <li className={`d-svc-cert ${t(certTone(cert.daysRemaining))}`}>
              <div style={{ minWidth: 0 }}>
                <p className="d-svc-name">
                  {certTone(cert.daysRemaining) === 'ok' ? <ShieldCheck aria-hidden /> : <ShieldAlert aria-hidden />}
                  Certificado
                </p>
                <p className="d-svc-meta">{cert.issuer ?? 'Emisor desconocido'}, vence el {formatDateTime(cert.validTo)}</p>
              </div>
              <Chip tone={certTone(cert.daysRemaining)}>
                {cert.daysRemaining == null ? 'Sin datos' : cert.daysRemaining < 0 ? 'Vencido' : `${cert.daysRemaining} días`}
              </Chip>
            </li>
          )}
        </ul>
      )}
    </Tile>
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

// Como un reproductor: la barra avanza del último backup al próximo.
function BackupsTile({ data, now }: { data: Backups | { error: string }; now: number }) {
  if (isError(data)) {
    return (
      <Tile id="backups" area="a-back" title="Backups">
        <SectionError message={data.error} />
      </Tile>
    );
  }
  const st = backupState(data, now);
  const last = data.lastSuccessAt ? new Date(data.lastSuccessAt).getTime() : null;
  const next = new Date(data.nextRunAt).getTime();
  const progress = last && next > last ? ((now - last) / (next - last)) * 100 : null;
  const lastWeekly = data.weekly[0];
  return (
    <Tile id="backups" area="a-back" title="Backups" action={<Chip tone={st.tone}>{st.label}</Chip>}>
      <div className={`d-back-cover ${t(st.tone === 'muted' ? 'ok' : st.tone)}`}>
        <CloudVault className={`d-back-art ${t(data.driveOk ? (st.tone === 'muted' ? 'ok' : st.tone) : 'warn')}`} />
      </div>
      <div>
        <p className="d-back-title">Copia diaria</p>
        <p className="d-tile-sub">{data.driveOk ? 'Cifrada y guardada en Google Drive' : 'El último backup no subió a Google Drive'}</p>
        {data.status === 'down' && data.lastMessage && <p className="d-back-error" style={{ marginTop: 6 }}>{data.lastMessage}</p>}
      </div>
      <div className="d-back-progress">
        <Bar value={progress} tone="ok" accent />
        <div className="d-back-times num">
          <span>{formatRelative(data.lastSuccessAt, now)}</span>
          <span>próximo {formatRelative(data.nextRunAt, now)}</span>
        </div>
      </div>
      <dl className="d-back-facts num">
        <div><dt>Último</dt><dd>{formatDateTime(data.lastSuccessAt)}</dd></div>
        <div><dt>Próximo</dt><dd>{formatDateTime(data.nextRunAt)}</dd></div>
        <div><dt>Mundos (semanal)</dt><dd>{lastWeekly ? formatBytes(lastWeekly.bytes) : 'Los domingos'}</dd></div>
        <div><dt>Espacio usado</dt><dd>{formatBytes(data.totalBytes)}</dd></div>
      </dl>
    </Tile>
  );
}

// ---------- saludo y resumen ----------

function findProblems(data: Overview, now: number): { text: string; tone: Tone }[] {
  const problems: { text: string; tone: Tone }[] = [];
  for (const value of Object.values(data)) {
    if (isError(value)) problems.push({ text: value.error, tone: 'crit' });
  }
  if (!isError(data.nodes)) {
    for (const n of data.nodes) {
      if (nodeHealth(n, now).tone === 'crit') problems.push({ text: `${n.name} no responde al monitor`, tone: 'crit' });
      if ((n.cpuTemp ?? 0) >= LIMITS.tempWarn) problems.push({ text: `${n.name} está a ${Math.round(n.cpuTemp!)} °C`, tone: toneFor(n.cpuTemp, LIMITS.tempWarn, LIMITS.tempCrit) });
      for (const d of n.disks) if ((d.pct ?? 0) >= LIMITS.diskWarn) problems.push({ text: `El disco ${d.label} de ${n.name} está al ${Math.round(d.pct!)} %`, tone: toneFor(d.pct, LIMITS.diskWarn, LIMITS.diskCrit) });
      for (const c of n.containers) if (c.health === 'unhealthy') problems.push({ text: `El contenedor ${c.name} tiene problemas`, tone: 'crit' });
    }
  }
  if (!isError(data.services)) {
    for (const s of data.services) if (s.status === 'down') problems.push({ text: `${s.name} está caído`, tone: 'crit' });
  }
  if (!isError(data.backups)) {
    const st = backupState(data.backups, now);
    if (st.tone === 'crit') problems.push({ text: 'El último backup falló', tone: 'crit' });
    if (st.tone === 'warn') problems.push({ text: 'El backup diario está atrasado', tone: 'warn' });
  }
  if (!isError(data.originCert) && data.originCert.configured && !('error' in data.originCert)) {
    const days = data.originCert.daysRemaining;
    if (days != null && days <= LIMITS.certWarnDays) problems.push({ text: `El certificado vence en ${days} días`, tone: certTone(days) });
  }
  return problems;
}

function greeting(now: number) {
  const hour = Number(new Intl.DateTimeFormat('es-AR', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ }).format(now));
  const hello = hour >= 6 && hour < 13 ? 'Buen día' : hour >= 13 && hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  const date = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }).format(now);
  return `${hello}, ${OWNER}. Hoy es ${date}.`;
}

function Hero({ nodes, problems, error, offlineSince, generatedAt, now }: {
  nodes: ServerNode[];
  problems: { text: string; tone: Tone }[];
  error?: string;
  offlineSince?: number;
  generatedAt: string;
  now: number;
}) {
  const shown = problems.slice(0, 4);
  let title: React.ReactNode;
  if (error) title = offlineSince ? 'No llego al servidor.' : 'No pude actualizar los datos.';
  else if (problems.length) title = problems.length === 1 ? 'Hay una cosa para revisar.' : `Hay ${problems.length} cosas para revisar.`;
  else if (nodes.length === 1) title = <><b>{nodes[0].name}</b> está en línea y todo anda bien.</>;
  else title = `Tus ${nodes.length} equipos están en línea y todo anda bien.`;

  return (
    <div className="d-hero a-hero">
      <p className="d-hero-greet">{greeting(now)}</p>
      <h1 className="d-hero-title">{title}</h1>
      {error ? (
        <p className="d-hero-meta">
          {offlineSince ? `Sin respuesta desde ${formatRelative(new Date(offlineSince).toISOString(), now)}. ` : `${error} `}
          Lo que ves son los últimos datos, del {formatDateTime(generatedAt)}.
        </p>
      ) : (
        shown.length > 0 && (
          <div className="d-hero-issues">
            {shown.map((p) => (
              <p key={p.text} className={`d-hero-issue d-glass ${t(p.tone)}`}>
                <CircleAlert aria-hidden /> {p.text}
              </p>
            ))}
            {problems.length > shown.length && <p className="d-hero-more">Y {problems.length - shown.length} más.</p>}
          </div>
        )
      )}
      <NotifyControl />
    </div>
  );
}

// ---------- página ----------

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: Overview; fetchedAt: number; offlineSince?: number; error?: string }
  | { kind: 'failed'; error: string; offline: boolean; status: number };

const SECTIONS = [
  { href: '#equipo', label: 'Equipo', icon: Server },
  { href: '#juegos', label: 'Juegos', icon: Gamepad2 },
  { href: '#backups', label: 'Backups', icon: Archive },
  { href: '#servicios', label: 'Servicios', icon: Activity },
];

export default function Dashboard({ fontClassName = '' }: { fontClassName?: string }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<string | null>(null);

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
  const nodes = state.kind === 'ready' && !isError(state.data.nodes) ? state.data.nodes : [];
  const node = nodes.find((n) => n.id === selected) ?? nodes[0];
  const mood = state.kind !== 'ready' ? '' : state.error || problems.some((p) => p.tone === 'crit') ? 'd-mood-crit' : problems.length ? 'd-mood-warn' : '';

  return (
    <main className={`dash ${mood} ${fontClassName}`}>
      <div className="dash-wrap">
        <nav className="d-dock d-dock-top d-glass" aria-label="Secciones">
          <a href="#inicio" aria-label="Inicio" className="d-icon-only"><House aria-hidden /></a>
          {SECTIONS.map((s) => (
            <a key={s.href} href={s.href}>
              <s.icon aria-hidden /><span className="d-hide-sm">{s.label}</span>
            </a>
          ))}
          <span className="d-sep" aria-hidden />
          <a href="https://panel.thesortty.dev" target="_blank" rel="noreferrer" aria-label="Abrir Pterodactyl" title="Pterodactyl">
            <span className="d-hide-sm">Panel</span><ExternalLink aria-hidden />
          </a>
          <a href="https://kuma.thesortty.dev" target="_blank" rel="noreferrer" aria-label="Abrir Uptime Kuma" title="Uptime Kuma">
            <span className="d-hide-sm">Kuma</span><ExternalLink aria-hidden />
          </a>
          <span className="d-sep" aria-hidden />
          <button type="button" onClick={load} disabled={refreshing} aria-label="Actualizar" title="Actualizar" className="d-icon-only">
            <RefreshCw className={refreshing ? 'd-spin' : ''} aria-hidden />
          </button>
        </nav>

        {state.kind === 'loading' && (
          <div className="d-center">
            <p className="d-loading" role="status">
              <LoaderCircle className="d-spin" aria-hidden /> Consultando el servidor…
            </p>
          </div>
        )}

        {state.kind === 'failed' && (
          <div className="d-center">
            <div className={`d-tile d-glass d-fail ${t(state.offline || state.status === 0 ? 'crit' : 'warn')}`}>
              {state.status === 403 || state.status === 401 ? <Lock aria-hidden /> : <CloudOff aria-hidden />}
              <h2>
                {state.offline ? 'El servidor no responde' : state.status === 401 ? 'Sesión vencida' : state.status === 403 ? 'Sin acceso' : 'No se pudo cargar el estado'}
              </h2>
              <p>
                {state.offline
                  ? 'La PC puede estar apagada o sin internet. Si se cortó la luz, va a volver sola cuando se prenda.'
                  : state.error}
              </p>
              <button type="button" className="d-text-btn" onClick={state.status === 401 ? () => window.location.reload() : load}>
                {state.status === 401 ? 'Volver a entrar' : 'Reintentar'}
              </button>
            </div>
          </div>
        )}

        {state.kind === 'ready' && (
          <div id="inicio" className={`d-bento ${state.error ? 'd-is-stale' : ''}`}>
            <Hero
              nodes={nodes}
              problems={problems}
              error={state.error}
              offlineSince={state.offlineSince}
              generatedAt={state.data.generatedAt}
              now={now}
            />
            {isError(state.data.nodes) ? (
              <Tile area="a-node" title="Equipos"><SectionError message={state.data.nodes.error} /></Tile>
            ) : !node ? (
              <Tile area="a-node" title="Equipos"><p className="d-empty">Todavía no hay equipos agregados en Beszel.</p></Tile>
            ) : (
              <>
                <NodeTile key={node.id} node={node} now={now} />
                <TempTile node={node} />
                <NetTile node={node} />
                <DisksTile node={node} />
              </>
            )}
            <GamesTile data={state.data.gameServers} />
            <ServicesTile services={state.data.services} cert={state.data.originCert} now={now} />
            <BackupsTile data={state.data.backups} now={now} />
          </div>
        )}

        {nodes.length > 1 && (
          <nav className="d-dock d-glass" aria-label="Equipos">
            {nodes.map((n) => (
              <button key={n.id} type="button" aria-current={n.id === node?.id} onClick={() => setSelected(n.id)}>
                <span className={`d-dot ${t(nodeHealth(n, now).tone)}`} aria-hidden />
                {n.name}
              </button>
            ))}
          </nav>
        )}
      </div>
    </main>
  );
}
