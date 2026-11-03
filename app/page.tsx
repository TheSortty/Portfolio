'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Download, Github, Linkedin, Lock, Mail, MessageCircle, Moon, Sun } from 'lucide-react';
import { PcTower } from './dashboard/art';
import { content, EMAIL, GITHUB, LINKEDIN, waLink, type Lang } from './content';
import type { PublicStatus } from './api/status/route';
import './site.css';

type Theme = 'light' | 'dark';

function useTheme(): [Theme | null, () => void] {
  // null = sigue el tema del sistema hasta que la persona elige uno.
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {}
  }, []);
  const toggle = () => {
    const current = theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
  };
  return [theme, toggle];
}

// ---------- tarjeta en vivo del servidor de casa ----------

function LiveCard({ t }: { t: (typeof content)['es']['live'] }) {
  const [status, setStatus] = useState<PublicStatus | 'loading'>('loading');
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/status')
        .then((r) => r.json())
        .then((s: PublicStatus) => alive && setStatus(s))
        .catch(() => alive && setStatus({ available: false }));
    load();
    const id = setInterval(() => !document.hidden && load(), 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const state = status === 'loading' ? 'loading' : !status.available ? 'unknown' : status.online ? 'online' : 'offline';
  const label = { loading: t.checking, unknown: t.unknown, online: t.online, offline: t.offline }[state];
  const facts: string[] = [];
  if (status !== 'loading' && status.available && status.online) {
    if (status.uptimeDays != null) facts.push(t.uptime(status.uptimeDays));
    if (status.cpuTemp != null) facts.push(t.temp(status.cpuTemp));
    if (status.gameServers && status.gameServers.total > 0) facts.push(t.games(status.gameServers.running, status.gameServers.total));
    if (status.backupOk) facts.push(t.backup);
  }

  return (
    <aside className="p-live" aria-labelledby="live-title" aria-live="polite">
      <PcTower className={`p-live-art s-${state}`} />
      <div className="p-live-body">
        <div className="p-live-head">
          <h2 id="live-title">{t.title}</h2>
          <span className={`p-status s-${state}`}>{label}</span>
        </div>
        {facts.length > 0 && (
          <ul className="p-live-facts">
            {facts.map((f) => <li key={f}>{f}</li>)}
          </ul>
        )}
        <p className="p-live-text">{t.body}</p>
        <a className="p-link" href="#servidor">{t.how}</a>
      </div>
    </aside>
  );
}

// ---------- cotización rápida ----------

function QuoteBuilder({ t }: { t: (typeof content)['es']['tech'] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const all = useMemo(() => t.groups.flatMap((g) => g.items), [t]);
  // Si cambia el idioma, se desmarca todo: los nombres son otros.
  useEffect(() => setPicked([]), [t]);

  const toggle = (item: string) => setPicked((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));
  const ordered = all.filter((i) => picked.includes(i));

  return (
    <div className="p-quote">
      <div className="p-quote-groups">
        {t.groups.map((g) => (
          <fieldset key={g.name} className="p-quote-group">
            <legend>{g.name}</legend>
            {g.items.map((item) => (
              <label key={item} className="p-check">
                <input type="checkbox" checked={picked.includes(item)} onChange={() => toggle(item)} />
                <span className="p-check-box" aria-hidden><Check /></span>
                <span>{item}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      <label className="p-note">
        <span>{t.note}</span>
        <textarea id="quote-note" rows={2} value={note} placeholder={t.notePlaceholder} onChange={(e) => setNote(e.target.value)} maxLength={400} />
      </label>

      <div className="p-quote-bar">
        <p className="p-quote-count" aria-live="polite">{t.selected(picked.length)}</p>
        {picked.length > 0 && (
          <button type="button" className="p-btn-text" onClick={() => setPicked([])}>{t.clear}</button>
        )}
        <a className="p-btn p-btn-primary" href={waLink(t.message(ordered, note.trim()))} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden /> {t.send}
        </a>
      </div>
    </div>
  );
}

// ---------- página ----------

export default function Portfolio() {
  const [lang, setLang] = useState<Lang>('es');
  const [, toggleTheme] = useTheme();
  const c = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="p-site">
      <a className="p-skip" href="#contenido">{lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>

      <header className="p-header">
        <a href="#inicio" className="p-brand">Gonzalo Murguia</a>
        <nav className="p-nav" aria-label={lang === 'es' ? 'Secciones' : 'Sections'}>
          <a href="#tecnico">{c.nav.tech}</a>
          <a href="#desarrollo">{c.nav.dev}</a>
          <a href="#proyectos">{c.nav.projects}</a>
          <a href="#contacto">{c.nav.contact}</a>
        </nav>
        <div className="p-tools">
          <button type="button" className="p-icon-btn" onClick={() => setLang(lang === 'es' ? 'en' : 'es')} aria-label={c.nav.lang} title={c.nav.lang}>
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
          <button type="button" className="p-icon-btn" onClick={toggleTheme} aria-label={c.nav.theme} title={c.nav.theme}>
            <Sun className="p-sun" aria-hidden />
            <Moon className="p-moon" aria-hidden />
          </button>
        </div>
      </header>

      <main id="contenido">
        <section id="inicio" className="p-hero">
          <div className="p-hero-text">
            <p className="p-who">{c.hero.who}</p>
            <h1>{c.hero.title}</h1>
            <p className="p-lede">{c.hero.lede}</p>
            <div className="p-paths">
              <a className="p-btn p-btn-primary" href="#tecnico">{c.hero.tech}</a>
              <a className="p-btn" href="#desarrollo">{c.hero.dev}</a>
            </div>
            <a className="p-link" href="/cv.pdf" target="_blank" rel="noopener noreferrer"><Download aria-hidden /> {c.hero.cv}</a>
          </div>
          <LiveCard t={c.live} />
        </section>

        <section id="tecnico" className="p-section">
          <div className="p-section-head">
            <h2>{c.tech.title}</h2>
            <p className="p-lede">{c.tech.lede}</p>
            <ol className="p-steps">
              {c.tech.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </div>
          <QuoteBuilder t={c.tech} />
        </section>

        <section id="desarrollo" className="p-section">
          <div className="p-section-head">
            <h2>{c.dev.title}</h2>
            <p className="p-lede">{c.dev.lede}</p>
          </div>
          <div className="p-dev">
            <ol className="p-jobs">
              {c.dev.jobs.map((j) => (
                <li key={j.role} className="p-job">
                  <p className="p-job-when">{j.when}</p>
                  <div>
                    <h3>{j.role}</h3>
                    <p className="p-job-where">{j.where}</p>
                    <p>{j.text}</p>
                    <ul className="p-tags">{j.stack.map((s) => <li key={s}>{s}</li>)}</ul>
                  </div>
                </li>
              ))}
            </ol>
            <div className="p-stack">
              <h3>{c.dev.stackTitle}</h3>
              {c.dev.stack.map((g) => (
                <div key={g.name} className="p-stack-group">
                  <p className="p-stack-name">{g.name}</p>
                  <ul>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
                </div>
              ))}
              <a className="p-btn" href="/cv.pdf" target="_blank" rel="noopener noreferrer"><Download aria-hidden /> {c.hero.cv}</a>
            </div>
          </div>
        </section>

        <section id="proyectos" className="p-section">
          <div className="p-section-head">
            <h2>{c.projects.title}</h2>
            <p className="p-lede">{c.projects.lede}</p>
          </div>
          <div className="p-projects">
            {c.projects.items.map((p) => (
              <article key={p.name} className="p-project">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-project-shot" aria-label={`${c.projects.visit}: ${p.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" loading="lazy" />
                </a>
                <div className="p-project-text">
                  <h3>{p.name}</h3>
                  <p>{p.text}</p>
                  <ul className="p-tags">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
                  <a className="p-link" href={p.url} target="_blank" rel="noopener noreferrer">{c.projects.visit} <ArrowUpRight aria-hidden /></a>
                </div>
              </article>
            ))}
            <article id="servidor" className="p-project p-project-home">
              <div className="p-project-shot p-project-art" aria-hidden>
                <PcTower className="s-online" />
              </div>
              <div className="p-project-text">
                <h3>{c.projects.home.name}</h3>
                <p>{c.projects.home.text}</p>
                <ul className="p-tags">{c.projects.home.stack.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            </article>
          </div>
        </section>

        <section id="contacto" className="p-section p-contact">
          <div className="p-section-head">
            <h2>{c.contact.title}</h2>
            <p className="p-lede">{c.contact.lede}</p>
          </div>
          <div className="p-contact-links">
            <a className="p-btn p-btn-primary" href={waLink(c.contact.whatsappText)} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden /> {c.contact.whatsapp}</a>
            <a className="p-btn" href={`mailto:${EMAIL}`}><Mail aria-hidden /> {c.contact.email}</a>
            <a className="p-btn" href={LINKEDIN} target="_blank" rel="noopener noreferrer"><Linkedin aria-hidden /> {c.contact.linkedin}</a>
            <a className="p-btn" href={GITHUB} target="_blank" rel="noopener noreferrer"><Github aria-hidden /> {c.contact.github}</a>
          </div>
          <p className="p-mail">{EMAIL}</p>
        </section>
      </main>

      <footer className="p-footer">
        <span>© {new Date().getFullYear()} Gonzalo Murguia</span>
        <a href="/dashboard" className="p-footer-panel" aria-label={c.footer.panel} title={c.footer.panel}><Lock aria-hidden /></a>
      </footer>
    </div>
  );
}
