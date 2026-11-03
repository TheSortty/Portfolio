// Forma del JSON que devuelve el gateway del servidor (littlemc-gateway, GET /v1/overview).
// Cada sección puede venir como { error } si esa fuente no se pudo leer.

export type SectionError = { error: string };

export type NodeStatus = 'up' | 'down' | 'paused' | 'pending';

export interface Disk {
  key: string;
  label: string;
  totalGB: number | null;
  usedGB: number | null;
  pct: number | null;
}

export interface Container {
  name: string;
  image: string;
  status: string;
  cpuPct: number | null;
  memMB: number | null;
  health: 'none' | 'starting' | 'healthy' | 'unhealthy';
}

export interface HistoryPoint {
  time: string | null;
  cpu: number | null;
  mem: number | null;
  temp: number | null;
}

export interface ServerNode {
  id: string;
  name: string;
  status: NodeStatus;
  updatedAt: string | null;
  agentVersion: string | null;
  uptimeSec: number | null;
  threads: number | null;
  cpuPct: number | null;
  memPct: number | null;
  memUsedGB: number | null;
  memTotalGB: number | null;
  load: number[] | null;
  cpuTemp: number | null;
  temps: Record<string, number | null>;
  net: { upBps: number; downBps: number } | null;
  disks: Disk[];
  containers: Container[];
  history: HistoryPoint[];
}

export type ServiceStatus = 'up' | 'down' | 'pending' | 'maintenance' | 'paused' | 'unknown';

export interface Service {
  id: number;
  name: string;
  type: string;
  target: string | null;
  status: ServiceStatus;
  message: string | null;
  checkedAt: string | null;
  pingMs: number | null;
  uptime24h: number | null;
  edgeCertDays: number | null;
}

export interface BackupFile {
  name: string;
  bytes: number;
  modifiedAt: string;
}

export interface Backups {
  status: ServiceStatus;
  lastMessage: string | null;
  lastReportAt: string | null;
  lastSuccessAt: string | null;
  driveOk: boolean;
  nextRunAt: string;
  daily: BackupFile[];
  weekly: BackupFile[];
  totalBytes: number;
}

export type OriginCert =
  | { configured: false }
  | { configured: true; error: string }
  | { configured: true; name: string; issuer: string | null; validTo: string | null; daysRemaining: number | null };

export type GameServerState = 'running' | 'starting' | 'stopping' | 'offline' | 'installing' | 'suspended' | 'unknown';

export interface GameServer {
  id: string;
  name: string;
  node: string;
  kind: 'minecraft' | 'other';
  port: number | null;
  /** Dirección para conectarse, si está configurada en el gateway (GAME_ADDRESSES). */
  address: string | null;
  /** Solo Minecraft encendido: jugadores conectados (Server List Ping). */
  players: { online: number; max: number | null; names: string[]; version: string | null } | null;
  backups: { count: number; limit: number; last: { at: string; ok: boolean; done: boolean; bytes: number } | null } | null;
  schedules: { name: string; active: boolean; nextRunAt: string | null; lastRunAt: string | null }[] | null;
  state: GameServerState;
  cpuPct: number | null;
  memBytes: number | null;
  diskBytes: number | null;
  uptimeMs: number | null;
  limits: { memMB: number | null; diskMB: number | null; cpuPct: number | null };
}

export type GameServers = { configured: false } | { configured: true; servers: GameServer[] };

export interface Incident {
  start: string;
  end: string | null;
  durationSec: number;
  reason: string | null;
}

export interface History {
  since: string;
  monitors: { name: string; incidents: Incident[] }[];
}

export interface HostDisk {
  device: string;
  model: string | null;
  healthy: boolean | null;
  tempC: number | null;
  powerOnHours: number | null;
  lifeLeftPct: number | null;
  reallocated: number | null;
  pending: number | null;
  uncorrectable: number | null;
}

export type HostInfo =
  | { configured: false }
  | {
      configured: true;
      generatedAt: string;
      disks: HostDisk[];
      updates: { count: number; security: number; names: string[] };
      reboot: { required: boolean; runningKernel: string; latestKernel: string; packages: string[]; bootedAt: string };
    };

export interface Overview {
  generatedAt: string;
  nodes: ServerNode[] | SectionError;
  services: Service[] | SectionError;
  history: History | SectionError;
  host: HostInfo | SectionError;
  backups: Backups | SectionError;
  originCert: OriginCert | SectionError;
  gameServers: GameServers | SectionError;
}

export const isError = (v: unknown): v is SectionError =>
  typeof v === 'object' && v !== null && 'error' in v && typeof (v as SectionError).error === 'string';
