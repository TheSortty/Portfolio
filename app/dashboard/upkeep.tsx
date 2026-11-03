'use client';

import { HardDrive, PackageOpen, Power } from 'lucide-react';
import { isError, type History, type HostInfo, type SectionError } from '@/lib/dashboard/types';
import { formatDateTime, formatDuration, formatRelative, type Tone } from './format';

// Tarjetas de mantenimiento de la PC y de historial de caídas.

const t = (tone: Tone) => `t-${tone}`;

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`d-chip ${t(tone)}`}>{children}</span>;
}

const years = (hours: number) => {
  const y = hours / 8766;
  return y >= 1 ? `${y.toLocaleString('es-AR', { maximumFractionDigits: 1 })} años de uso` : `${Math.round(hours / 730)} meses de uso`;
};

// ---------- mantenimiento ----------

export function MaintenanceTile({ data, now }: { data: HostInfo | SectionError; now: number }) {
  if (isError(data)) {
    return (
      <section className="d-tile d-glass a-maint" aria-label="Mantenimiento">
        <header className="d-tile-head"><h2 className="d-tile-title">Mantenimiento</h2></header>
        <p className="d-error">{data.error}</p>
      </section>
    );
  }
  if (!data.configured) {
    return (
      <section className="d-tile d-glass a-maint" aria-label="Mantenimiento">
        <header className="d-tile-head"><h2 className="d-tile-title">Mantenimiento</h2></header>
        <p className="d-empty">
          Para ver la salud de los discos y las actualizaciones, instalá el recolector en la PC:{' '}
          <code className="d-code">sudo ./host/install-hostinfo.sh</code> desde la carpeta del gateway.
        </p>
      </section>
    );
  }

  const stale = now - new Date(data.generatedAt).getTime() > 3 * 3_600_000;
  const badDisks = data.disks.filter((d) => d.healthy === false).length;
  const tone: Tone = badDisks ? 'crit' : data.reboot.required ? 'warn' : 'ok';
  const label = badDisks ? 'Disco con fallas' : data.reboot.required ? 'Reinicio pendiente' : 'Al día';

  return (
    <section className="d-tile d-glass a-maint" aria-label="Mantenimiento">
      <header className="d-tile-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="d-tile-title">Mantenimiento</h2>
          <p className="d-tile-sub">Revisado {formatRelative(data.generatedAt, now)}{stale ? '. El recolector no corre hace rato.' : ''}</p>
        </div>
        <Chip tone={tone}>{label}</Chip>
      </header>

      <ul className="d-maint-list">
        <li className={t(data.reboot.required ? 'warn' : 'ok')}>
          <Power aria-hidden />
          <div>
            <p className="d-maint-name">{data.reboot.required ? 'Hace falta reiniciar' : 'No hace falta reiniciar'}</p>
            <p className="d-maint-meta">
              {data.reboot.required
                ? `Está instalado el kernel ${data.reboot.latestKernel} y corre el ${data.reboot.runningKernel}. Reiniciá cuando no haya nadie jugando.`
                : `Encendida desde el ${formatDateTime(data.reboot.bootedAt)}.`}
            </p>
          </div>
        </li>
        <li className={t(data.updates.security ? 'warn' : 'muted')}>
          <PackageOpen aria-hidden />
          <div>
            <p className="d-maint-name">
              {data.updates.count === 0 ? 'Sin actualizaciones pendientes' : data.updates.count === 1 ? '1 actualización pendiente' : `${data.updates.count} actualizaciones pendientes`}
            </p>
            <p className="d-maint-meta">
              {data.updates.security ? `${data.updates.security} de seguridad. ` : ''}
              {data.updates.count > 0 && 'Se aplican con sudo apt upgrade.'}
            </p>
          </div>
        </li>
        {data.disks.map((d) => {
          const lifeTone: Tone = d.healthy === false ? 'crit' : d.lifeLeftPct != null && d.lifeLeftPct < 20 ? 'warn' : 'ok';
          const errors = (d.reallocated ?? 0) + (d.pending ?? 0) + (d.uncorrectable ?? 0);
          return (
            <li key={d.device} className={t(lifeTone)}>
              <HardDrive aria-hidden />
              <div style={{ minWidth: 0 }}>
                <p className="d-maint-name">
                  {d.model ?? d.device}{' '}
                  <span className="d-maint-flag">{d.healthy === false ? 'Falla' : d.healthy ? 'Sano' : 'Sin datos'}</span>
                </p>
                <p className="d-maint-meta num">
                  {[
                    d.lifeLeftPct != null && `${d.lifeLeftPct} % de vida`,
                    d.tempC != null && `${d.tempC} °C`,
                    d.powerOnHours != null && years(d.powerOnHours),
                    errors > 0 && `${errors} sectores con errores`,
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------- historial de caídas ----------

const DAYS = 30;

function dayIndex(iso: string, since: number) {
  return Math.floor((new Date(iso).getTime() - since) / 86400_000);
}

export function HistoryTile({ data, now }: { data: History | SectionError; now: number }) {
  if (isError(data)) {
    return (
      <section className="d-tile d-glass a-hist" aria-label="Historial de caídas">
        <header className="d-tile-head"><h2 className="d-tile-title">Historial de caídas</h2></header>
        <p className="d-error">{data.error}</p>
      </section>
    );
  }
  const since = new Date(data.since).getTime();
  const all = data.monitors.flatMap((m) => m.incidents.map((i) => ({ ...i, name: m.name })));
  const recent = [...all].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()).slice(0, 5);
  const total = all.reduce((a, i) => a + i.durationSec, 0);

  return (
    <section className="d-tile d-glass a-hist" aria-label="Historial de caídas">
      <header className="d-tile-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="d-tile-title">Historial de caídas</h2>
          <p className="d-tile-sub">
            Últimos {DAYS} días: {all.length === 0 ? 'sin caídas' : `${all.length} ${all.length === 1 ? 'caída' : 'caídas'}, ${formatDuration(total)} en total`}
          </p>
        </div>
      </header>

      <div className="d-hist-rows">
        {data.monitors.map((m) => {
          // Minutos caído por día, para pintar cada día según cuánto duró.
          const perDay = Array.from({ length: DAYS }, () => 0);
          for (const i of m.incidents) {
            const start = new Date(i.start).getTime();
            const end = i.end ? new Date(i.end).getTime() : now;
            for (let d = Math.max(0, dayIndex(i.start, since)); d <= Math.min(DAYS - 1, dayIndex(new Date(end).toISOString(), since)); d++) {
              const dayStart = since + d * 86400_000;
              perDay[d] += Math.max(0, Math.min(end, dayStart + 86400_000) - Math.max(start, dayStart)) / 60_000;
            }
          }
          return (
            <div key={m.name} className="d-hist-row">
              <p className="d-hist-name">
                {m.name}
                <span className="d-hist-count">{m.incidents.length === 0 ? 'sin caídas' : `${m.incidents.length} ${m.incidents.length === 1 ? 'caída' : 'caídas'}`}</span>
              </p>
              <div className="d-hist-days" role="img" aria-label={`${m.name}: ${m.incidents.length} caídas en ${DAYS} días`}>
                {perDay.map((min, d) => {
                  const date = new Date(since + d * 86400_000).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                  const level = min === 0 ? 0 : min < 15 ? 1 : min < 60 ? 2 : 3;
                  return (
                    <span
                      key={d}
                      className={`d-hist-day l${level}`}
                      title={min === 0 ? `${date}: sin caídas` : `${date}: ${formatDuration(Math.round(min * 60))} caído`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="d-hist-axis" aria-hidden><span>hace {DAYS} días</span><span>hoy</span></div>
      </div>

      {recent.length > 0 && (
        <ul className="d-hist-list">
          {recent.map((i) => (
            <li key={`${i.name}-${i.start}`}>
              <span className="d-hist-when num">{formatDateTime(i.start)}</span>
              <span className="d-hist-what">
                <b>{i.name}</b> {i.end ? `caído ${formatDuration(i.durationSec)}` : 'caído ahora'}
                {i.reason && <span className="d-hist-reason">{humanReason(i.reason)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Traduce los mensajes técnicos más comunes de Kuma a algo entendible.
function humanReason(msg: string) {
  if (/EAI_AGAIN|ENOTFOUND/.test(msg)) return 'Sin DNS: probablemente se cortó internet.';
  if (/\b530\b/.test(msg)) return 'El túnel de Cloudflare no llegaba a la PC.';
  if (/\b502\b|\b504\b/.test(msg)) return 'El servicio no respondía detrás del túnel.';
  if (/timeout|ETIMEDOUT/i.test(msg)) return 'No respondió a tiempo.';
  if (/ECONNREFUSED/.test(msg)) return 'El servicio estaba apagado.';
  return msg.length > 80 ? `${msg.slice(0, 80)}…` : msg;
}
