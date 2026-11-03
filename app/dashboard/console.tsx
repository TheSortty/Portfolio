'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Archive, Check, Copy, LoaderCircle, Play, Power, RotateCw, SendHorizontal, Square, SquareTerminal, X } from 'lucide-react';
import type { GameServer } from '@/lib/dashboard/types';
import { formatBytes, formatRelative } from './format';

// Control de un servidor de Pterodactyl desde el panel: encender, apagar,
// reiniciar y una consola en vivo conectada directo a Wings (como el panel
// de Pterodactyl), con un permiso temporal que se renueva solo.

type Signal = 'start' | 'stop' | 'restart' | 'kill';

async function sendPower(id: string, signal: Signal) {
  const res = await fetch(`/api/dashboard/servers/${id}/power`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signal }),
    redirect: 'manual',
  });
  if (res.type === 'opaqueredirect') throw new Error('Tu sesión venció. Recargá la página.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
}

async function consoleTicket(id: string): Promise<{ token: string; socket: string }> {
  const res = await fetch(`/api/dashboard/servers/${id}/console`, { cache: 'no-store', redirect: 'manual' });
  if (res.type === 'opaqueredirect') throw new Error('Tu sesión venció. Recargá la página.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

const LABEL: Record<Signal, string> = { start: 'Encender', stop: 'Apagar', restart: 'Reiniciar', kill: 'Forzar apagado' };
const DONE: Record<Signal, string> = { start: 'Encendiendo…', stop: 'Apagando…', restart: 'Reiniciando…', kill: 'Apagado forzado' };

/** Botones de encendido. Apagar, reiniciar y forzar piden un segundo toque para confirmar. */
function PowerButtons({ server, state, onDone }: { server: GameServer; state: string; onDone: (msg: string) => void }) {
  const [busy, setBusy] = useState<Signal | null>(null);
  const [confirm, setConfirm] = useState<Signal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(null), 4000);
    return () => clearTimeout(t);
  }, [confirm]);

  const act = async (signal: Signal) => {
    if (signal !== 'start' && confirm !== signal) return setConfirm(signal);
    setConfirm(null);
    setBusy(signal);
    setError(null);
    try {
      await sendPower(server.id, signal);
      onDone(DONE[signal]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const running = state === 'running' || state === 'starting';
  const signals: Signal[] = state === 'offline' ? ['start'] : state === 'stopping' ? ['kill'] : running ? ['restart', 'stop'] : [];
  const icon = { start: Play, stop: Square, restart: RotateCw, kill: Power };

  return (
    <div className="d-power-row">
      {signals.map((s) => {
        const Icon = busy === s ? LoaderCircle : icon[s];
        return (
          <button
            key={s}
            type="button"
            className={`d-text-btn ${s === 'start' ? 'is-primary' : ''} ${confirm === s ? 'is-confirm' : ''}`}
            onClick={() => act(s)}
            disabled={busy !== null}
            aria-label={confirm === s ? `Confirmar: ${LABEL[s].toLowerCase()} ${server.name}` : `${LABEL[s]} ${server.name}`}
          >
            <Icon className={busy === s ? 'd-spin' : ''} aria-hidden />
            {confirm === s ? `¿${LABEL[s]}?` : LABEL[s]}
          </button>
        );
      })}
      {error && <p className="d-power-error">{error}</p>}
    </div>
  );
}

// Cuántas consolas hay abiertas: el panel no se recarga solo mientras haya una.
let openConsoles = 0;
export const consoleIsOpen = () => openConsoles > 0;

// Wings manda la salida con colores ANSI; acá se muestran en texto plano.
const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r/g, '');
const MAX_LINES = 600;

type Live = { state: string; memBytes: number | null; cpu: number | null };

function ConsoleDialog({ server, onClose, onPowerDone }: { server: GameServer; onClose: () => void; onPowerDone: (msg: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const output = useRef<HTMLPreElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const stick = useRef(true);
  const [lines, setLines] = useState<string[]>([]);
  const [conn, setConn] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [problem, setProblem] = useState<string | null>(null);
  const [live, setLive] = useState<Live>({ state: server.state, memBytes: server.memBytes, cpu: server.cpuPct });
  const [command, setCommand] = useState('');
  const history = useRef<string[]>([]);
  const historyAt = useRef(-1);

  const append = useCallback((text: string) => {
    setLines((prev) => [...prev, ...stripAnsi(text).split('\n')].slice(-MAX_LINES));
  }, []);

  const connect = useCallback(async () => {
    ws.current?.close();
    setConn('connecting');
    setProblem(null);
    let ticket: { token: string; socket: string };
    try {
      ticket = await consoleTicket(server.id);
    } catch (err) {
      setConn('error');
      setProblem((err as Error).message);
      return;
    }
    const socket = new WebSocket(ticket.socket);
    ws.current = socket;
    const send = (event: string, args: unknown[] = [null]) => socket.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ event, args }));
    socket.onopen = () => send('auth', [ticket.token]);
    socket.onmessage = async (e) => {
      const m = JSON.parse(e.data) as { event: string; args?: string[] };
      const arg = m.args?.[0] ?? '';
      switch (m.event) {
        case 'auth success':
          setConn('open');
          setLines([]);
          send('send logs');
          break;
        case 'console output':
        case 'install output':
          append(arg);
          break;
        case 'daemon message':
          append(`[Pterodactyl] ${arg}`);
          break;
        case 'status':
          setLive((l) => ({ ...l, state: arg }));
          break;
        case 'stats': {
          const s = JSON.parse(arg) as { memory_bytes?: number; cpu_absolute?: number; state?: string };
          setLive((l) => ({ state: s.state ?? l.state, memBytes: s.memory_bytes ?? l.memBytes, cpu: s.cpu_absolute ?? l.cpu }));
          break;
        }
        case 'token expiring':
          try {
            send('auth', [(await consoleTicket(server.id)).token]);
          } catch { /* si falla, Wings avisa "token expired" y se ofrece reconectar */ }
          break;
        case 'token expired':
        case 'jwt error':
          setProblem('El permiso de la consola venció.');
          socket.close();
          break;
        case 'daemon error':
          append(`[error] ${arg}`);
          break;
      }
    };
    socket.onerror = () => {
      setConn('error');
      setProblem('No se pudo conectar con la consola. Si recién configuraste Wings, probá de nuevo en unos segundos.');
    };
    socket.onclose = () => setConn((c) => (c === 'error' ? c : 'closed'));
  }, [server.id, append]);

  useEffect(() => {
    openConsoles++;
    dialog.current?.showModal();
    connect();
    return () => {
      openConsoles--;
      ws.current?.close();
    };
  }, [connect]);

  // Baja sola mientras estás al final; si subiste a leer, no te mueve.
  useEffect(() => {
    if (stick.current && output.current) output.current.scrollTop = output.current.scrollHeight;
  }, [lines]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = command.trim();
    if (!cmd || ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ event: 'send command', args: [cmd] }));
    history.current = [cmd, ...history.current.filter((h) => h !== cmd)].slice(0, 30);
    historyAt.current = -1;
    setCommand('');
    stick.current = true;
  };

  const browseHistory = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const next = Math.max(-1, Math.min(history.current.length - 1, historyAt.current + (e.key === 'ArrowUp' ? 1 : -1)));
    historyAt.current = next;
    setCommand(next === -1 ? '' : history.current[next]);
  };

  const input = useRef<HTMLInputElement>(null);
  const quick = (cmd: string) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ event: 'send command', args: [cmd] }));
    stick.current = true;
  };
  const announce = () => {
    setCommand('say ');
    input.current?.focus();
  };

  const stateLabel: Record<string, string> = { running: 'Encendido', starting: 'Iniciando', stopping: 'Apagando', offline: 'Apagado' };
  const tone = live.state === 'running' ? 't-ok' : live.state === 'offline' ? 't-muted' : 't-warn';

  return (
    <dialog ref={dialog} className="d-console" onClose={onClose} aria-labelledby="console-title">
      <header className="d-console-head">
        <div style={{ minWidth: 0 }}>
          <h2 id="console-title">{server.name}</h2>
          <p className="d-tile-sub num">
            <span className={`d-chip ${tone}`}>{stateLabel[live.state] ?? live.state}</span>{' '}
            {live.state === 'running' && `${formatBytes(live.memBytes)}, CPU ${live.cpu == null ? '—' : `${live.cpu.toFixed(1).replace('.', ',')} %`}`}
          </p>
        </div>
        <button type="button" className="d-icon-btn" onClick={() => dialog.current?.close()} aria-label="Cerrar consola">
          <X aria-hidden />
        </button>
      </header>

      <PowerButtons server={server} state={live.state} onDone={onPowerDone} />

      <pre
        ref={output}
        className="d-console-out"
        aria-live="polite"
        aria-label="Salida de la consola"
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
      >
        {conn === 'connecting' && lines.length === 0 ? 'Conectando con la consola…' : lines.join('\n')}
      </pre>

      {server.kind === 'minecraft' && conn === 'open' && live.state === 'running' && (
        <div className="d-quick" aria-label="Comandos rápidos">
          <button type="button" className="d-text-btn" onClick={() => quick('list')}>Ver jugadores</button>
          <button type="button" className="d-text-btn" onClick={() => quick('save-all')}>Guardar mundo</button>
          <button type="button" className="d-text-btn" onClick={announce}>Avisar a todos</button>
        </div>
      )}

      {problem && (
        <div className="d-console-problem">
          <p>{problem}</p>
          <button type="button" className="d-text-btn" onClick={connect}>Reconectar</button>
        </div>
      )}

      <form className="d-console-input" onSubmit={submit}>
        <label htmlFor="console-cmd" className="d-sr">Comando</label>
        <input
          ref={input}
          id="console-cmd"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={browseHistory}
          placeholder={conn === 'open' ? 'Escribí un comando y Enter' : 'La consola no está conectada'}
          disabled={conn !== 'open'}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
        />
        <button type="submit" className="d-text-btn is-primary" disabled={conn !== 'open' || !command.trim()} aria-label="Enviar comando">
          <SendHorizontal aria-hidden />
        </button>
      </form>
    </dialog>
  );
}

/** Copia la dirección para pasársela a otros jugadores. */
export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copiá la dirección:', address);
    }
  };
  return (
    <button type="button" className="d-address" onClick={copy} aria-label={`Copiar dirección ${address}`}>
      <span className="num">{address}</span>
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span className="d-sr" aria-live="polite">{copied ? 'Copiada' : ''}</span>
    </button>
  );
}

function BackupButton({ server, onDone }: { server: GameServer; onDone: (msg: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [confirm]);
  const run = async () => {
    if (!confirm) return setConfirm(true);
    setConfirm(false);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/servers/${server.id}/backup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', redirect: 'manual' });
      if (res.type === 'opaqueredirect') throw new Error('Tu sesión venció. Recargá la página.');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      onDone('Backup en curso. Puede tardar unos minutos.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" className={`d-text-btn ${confirm ? 'is-confirm' : ''}`} onClick={run} disabled={busy}>
        {busy ? <LoaderCircle className="d-spin" aria-hidden /> : <Archive aria-hidden />}
        {confirm ? '¿Hacer backup?' : 'Backup'}
      </button>
      {error && <p className="d-power-error">{error}</p>}
    </>
  );
}

/** Botones y consola de un servidor, para la tarjeta de servidores. */
export function ServerControls({ server, onChanged }: { server: GameServer; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const canBackup = Boolean(server.backups && server.backups.limit > 0);
  const lastBackup = server.backups?.last;

  const done = (msg: string) => {
    setNote(msg);
    // Pterodactyl tarda unos segundos en cambiar de estado.
    setTimeout(onChanged, 2500);
    setTimeout(onChanged, 9000);
    setTimeout(() => setNote(null), 9000);
  };

  return (
    <div className="d-server-controls">
      <PowerButtons server={server} state={server.state} onDone={done} />
      <button type="button" className="d-text-btn" onClick={() => setOpen(true)}>
        <SquareTerminal aria-hidden /> Consola
      </button>
      {canBackup && <BackupButton server={server} onDone={(m) => { setNote(m); setTimeout(onChanged, 20_000); }} />}
      {canBackup && lastBackup && (
        <p className="d-power-note">
          Último backup {formatRelative(lastBackup.at, Date.now())}
          {!lastBackup.done ? ' (en curso)' : lastBackup.ok ? `, ${formatBytes(lastBackup.bytes)}` : ' (falló)'}
        </p>
      )}
      {note && <p className="d-power-note" role="status">{note}</p>}
      {open && <ConsoleDialog server={server} onClose={() => setOpen(false)} onPowerDone={done} />}
    </div>
  );
}
