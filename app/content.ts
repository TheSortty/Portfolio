// Textos del portafolio en castellano e inglés. Para cambiar un texto, se
// edita acá; el diseño vive en app/page.tsx y app/site.css.

export type Lang = 'es' | 'en';

export const WHATSAPP = '5492612407277';
export const EMAIL = 'gonzalo.d.murguia@gmail.com';
export const LINKEDIN = 'https://www.linkedin.com/in/gonzalo-murguia-5135b23b4/';
export const GITHUB = 'https://github.com/TheSortty';
// Vacío mientras public/cv.pdf sea un archivo de relleno: así no se muestra el botón.
// Cuando subas el PDF real a public/cv.pdf, poné '/cv.pdf'.
export const CV_URL = '';

export const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

const es = {
  nav: { tech: 'Servicio técnico', dev: 'Desarrollo', projects: 'Proyectos', contact: 'Contacto', theme: 'Cambiar tema claro u oscuro', lang: 'Read in English' },
  hero: {
    who: 'Gonzalo Murguia, en Buenos Aires',
    title: 'Arreglo computadoras y construyo software.',
    lede: 'Técnico IT desde 2021 y desarrollador. Pongo a punto equipos y redes a domicilio o en remoto, y desarrollo sitios web, automatizaciones y sistemas de telefonía.',
    tech: 'Necesito un técnico',
    dev: 'Busco un desarrollador',
    cv: 'Descargar CV',
  },
  live: {
    title: 'Mi servidor en casa',
    checking: 'Consultando…',
    online: 'En línea',
    offline: 'Apagado ahora',
    unknown: 'Sin datos ahora',
    uptime: (d: number) => (d === 0 ? 'Encendido hoy' : d === 1 ? 'Encendido hace 1 día' : `Encendido hace ${d} días`),
    temp: (t: number) => `Procesador a ${t} °C`,
    games: (r: number, t: number) => `${r} de ${t} servidores de juego encendidos`,
    backup: 'Último backup cifrado: correcto',
    body: 'Corre servidores de Minecraft, el monitoreo y los backups cifrados. Lo armé y lo mantengo yo.',
    how: 'Cómo está armado',
  },
  tech: {
    title: 'Servicio técnico',
    lede: 'A domicilio en Buenos Aires o por conexión remota. Marcá lo que necesitás y te paso el presupuesto por WhatsApp.',
    steps: ['Marcás lo que necesitás.', 'Se abre WhatsApp con el pedido armado.', 'Te respondo con el presupuesto.'],
    groups: [
      {
        name: 'Soporte y diagnóstico',
        items: ['Diagnóstico o revisión', 'Conexión remota (1 hora)', 'Visita a domicilio (1 hora)', 'Visita de emergencia fuera de horario', 'Configuración de router o access point'],
      },
      {
        name: 'Software y puesta a punto',
        items: ['Formateo e instalación del sistema', 'Configuración de equipo nuevo', 'Reparación del inicio de Windows', 'Limpieza de software y malware', 'Instalación de drivers', 'Instalación de programas'],
      },
      {
        name: 'Hardware',
        items: ['Limpieza, formateo, backup y cambio a SSD', 'Armado de PC desde cero', 'Limpieza profunda y pasta térmica', 'Cambio de pantalla o flex de notebook', 'Cambio de teclado de notebook'],
      },
    ],
    note: 'Contame qué pasa (opcional)',
    notePlaceholder: 'Ej.: la notebook tarda mucho en prender',
    selected: (n: number) => (n === 0 ? 'Todavía no marcaste nada' : n === 1 ? '1 servicio marcado' : `${n} servicios marcados`),
    send: 'Pedir presupuesto por WhatsApp',
    clear: 'Desmarcar todo',
    message: (items: string[], note: string) =>
      [
        'Hola Gonzalo, vengo de tu sitio y quiero un presupuesto.',
        items.length ? `Necesito:\n${items.map((i) => `• ${i}`).join('\n')}` : '',
        note ? `Detalle: ${note}` : '',
      ].filter(Boolean).join('\n\n'),
  },
  dev: {
    title: 'Desarrollo e infraestructura',
    lede: 'Graduado en la UTN. Trabajo en desarrollo web, automatización de procesos y telefonía IP, y administro servidores Linux y Windows.',
    jobs: [
      {
        when: '2021 – hoy',
        role: 'Técnico y desarrollador freelance',
        where: 'Independiente y Summit S.A.',
        text: 'Técnico IT desde 2021 y desarrollador freelance desde septiembre de 2025. Desarrollé las plataformas siendoHome e ideon, administro servidores Linux y Windows, y doy soporte técnico remoto y presencial.',
        stack: ['Python', 'FastAPI', 'n8n', 'Asterisk'],
      },
      {
        when: 'jul. – sep. 2025',
        role: 'Software engineer (pasantía)',
        where: 'Summit',
        text: 'Lideré la migración de la telefonía VoIP a PJSIP y optimicé el motor Asterisk. Diseñé la integración entre la central y las APIs de transcripción, y automaticé flujos de datos con FastAPI y n8n.',
        stack: ['TypeScript', 'React', 'Node.js'],
      },
    ],
    stackTitle: 'Con qué trabajo',
    stack: [
      { name: 'Desarrollo y automatización', items: ['Python (FastAPI)', 'TypeScript y Node.js', 'React y Next.js', 'n8n'] },
      { name: 'Infraestructura', items: ['Linux y Windows Server', 'Docker y redes', 'Cloudflare (Tunnel, Access, Workers)', 'Pterodactyl'] },
      { name: 'Telefonía y datos', items: ['Asterisk', 'Issabel y PJSIP', 'SQL', 'Git'] },
    ],
  },
  projects: {
    title: 'Proyectos',
    lede: 'Lo que hice, para quién y con qué.',
    visit: 'Ver el sitio',
    items: [
      {
        name: 'siendoHome',
        url: 'https://siendohome.com',
        image: '/IMAGEN-SIENDOHOME.png',
        text: 'Sitio y panel de administración para un programa de coaching, con sus programas y retiros.',
        stack: ['TypeScript', 'Node.js', 'Linux'],
      },
      {
        name: 'ideon.ar',
        url: 'https://ideon.ar',
        image: '/IMAGEN-IDEON.png',
        text: 'Servicio de páginas web profesionales listas en 24 horas y sin costo mensual: sitio, proceso de pedido e infraestructura.',
        stack: ['FastAPI', 'Desarrollo web', 'Infraestructura'],
      },
    ],
    home: {
      name: 'Servidor en casa',
      text: 'Una PC con Debian que corre servidores de Minecraft con Pterodactyl. Está publicada con Cloudflare Tunnel sin abrir puertos, con acceso protegido por Cloudflare Access, backups diarios cifrados en Google Drive, monitoreo con Uptime Kuma y Beszel, y un panel de control propio.',
      stack: ['Debian', 'Docker', 'Pterodactyl', 'Cloudflare', 'Next.js'],
    },
  },
  contact: {
    title: 'Hablemos',
    lede: 'Para servicio técnico, lo más rápido es WhatsApp. Para propuestas de trabajo, mail o LinkedIn.',
    whatsapp: 'Escribir por WhatsApp',
    whatsappText: 'Hola Gonzalo, vengo de tu sitio.',
    email: 'Mandar un mail',
    linkedin: 'Ver LinkedIn',
    github: 'Ver GitHub',
  },
  footer: { panel: 'Panel privado' },
};

type Content = typeof es;

const en: Content = {
  nav: { tech: 'Tech support', dev: 'Development', projects: 'Projects', contact: 'Contact', theme: 'Switch light or dark theme', lang: 'Leer en castellano' },
  hero: {
    who: 'Gonzalo Murguia, in Buenos Aires',
    title: 'I fix computers and build software.',
    lede: 'IT technician since 2021 and developer. I set up and repair computers and networks on site or remotely, and I build websites, automations and phone systems.',
    tech: 'I need a technician',
    dev: "I'm hiring a developer",
    cv: 'Download CV',
  },
  live: {
    title: 'My home server',
    checking: 'Checking…',
    online: 'Online',
    offline: 'Off right now',
    unknown: 'No data right now',
    uptime: (d: number) => (d === 0 ? 'Up since today' : d === 1 ? 'Up for 1 day' : `Up for ${d} days`),
    temp: (t: number) => `CPU at ${t} °C`,
    games: (r: number, t: number) => `${r} of ${t} game servers running`,
    backup: 'Last encrypted backup: OK',
    body: 'It runs Minecraft servers, monitoring and encrypted backups. I built it and I keep it running.',
    how: 'How it is built',
  },
  tech: {
    title: 'Tech support',
    lede: 'On site in Buenos Aires or remotely. Pick what you need and I will send you a quote on WhatsApp.',
    steps: ['Pick what you need.', 'WhatsApp opens with your request ready.', 'I reply with a quote.'],
    groups: [
      {
        name: 'Support and diagnostics',
        items: ['Diagnostics or check-up', 'Remote session (1 hour)', 'Home visit (1 hour)', 'Emergency visit after hours', 'Router or access point setup'],
      },
      {
        name: 'Software and tune-up',
        items: ['OS format and install', 'New computer setup', 'Windows startup repair', 'Software and malware cleanup', 'Driver installation', 'Software installation'],
      },
      {
        name: 'Hardware',
        items: ['Cleaning, format, backup and SSD upgrade', 'PC build from scratch', 'Deep cleaning and thermal paste', 'Laptop screen or flex cable replacement', 'Laptop keyboard replacement'],
      },
    ],
    note: 'Tell me what is going on (optional)',
    notePlaceholder: 'E.g. my laptop takes ages to start',
    selected: (n: number) => (n === 0 ? 'Nothing picked yet' : n === 1 ? '1 service picked' : `${n} services picked`),
    send: 'Ask for a quote on WhatsApp',
    clear: 'Clear all',
    message: (items: string[], note: string) =>
      [
        'Hi Gonzalo, I found your website and I would like a quote.',
        items.length ? `I need:\n${items.map((i) => `• ${i}`).join('\n')}` : '',
        note ? `Details: ${note}` : '',
      ].filter(Boolean).join('\n\n'),
  },
  dev: {
    title: 'Development and infrastructure',
    lede: 'UTN graduate. I work on web development, process automation and IP telephony, and I run Linux and Windows servers.',
    jobs: [
      {
        when: '2021 – today',
        role: 'Freelance technician and developer',
        where: 'Independent and Summit S.A.',
        text: 'IT technician since 2021 and freelance developer since September 2025. I built the siendoHome and ideon platforms, run Linux and Windows servers, and provide remote and on-site support.',
        stack: ['Python', 'FastAPI', 'n8n', 'Asterisk'],
      },
      {
        when: 'Jul – Sep 2025',
        role: 'Software engineer (internship)',
        where: 'Summit',
        text: 'Led the VoIP migration to PJSIP and tuned the Asterisk engine. Designed the integration between the PBX and transcription APIs, and automated data flows with FastAPI and n8n.',
        stack: ['TypeScript', 'React', 'Node.js'],
      },
    ],
    stackTitle: 'What I work with',
    stack: [
      { name: 'Development and automation', items: ['Python (FastAPI)', 'TypeScript and Node.js', 'React and Next.js', 'n8n'] },
      { name: 'Infrastructure', items: ['Linux and Windows Server', 'Docker and networking', 'Cloudflare (Tunnel, Access, Workers)', 'Pterodactyl'] },
      { name: 'Telephony and data', items: ['Asterisk', 'Issabel and PJSIP', 'SQL', 'Git'] },
    ],
  },
  projects: {
    title: 'Projects',
    lede: 'What I built, for whom and with what.',
    visit: 'Visit the site',
    items: [
      {
        name: 'siendoHome',
        url: 'https://siendohome.com',
        image: '/IMAGEN-SIENDOHOME.png',
        text: 'Website and admin panel for a coaching program, with its programs and retreats.',
        stack: ['TypeScript', 'Node.js', 'Linux'],
      },
      {
        name: 'ideon.ar',
        url: 'https://ideon.ar',
        image: '/IMAGEN-IDEON.png',
        text: 'Professional websites ready in 24 hours with no monthly fee: the site, the ordering flow and the infrastructure.',
        stack: ['FastAPI', 'Web development', 'Infrastructure'],
      },
    ],
    home: {
      name: 'Home server',
      text: 'A Debian PC running Minecraft servers with Pterodactyl. It is published through Cloudflare Tunnel with no open ports, access is protected by Cloudflare Access, daily encrypted backups go to Google Drive, monitoring runs on Uptime Kuma and Beszel, and it has its own control panel.',
      stack: ['Debian', 'Docker', 'Pterodactyl', 'Cloudflare', 'Next.js'],
    },
  },
  contact: {
    title: "Let's talk",
    lede: 'For tech support, WhatsApp is fastest. For job offers, email or LinkedIn.',
    whatsapp: 'Message on WhatsApp',
    whatsappText: 'Hi Gonzalo, I found your website.',
    email: 'Send an email',
    linkedin: 'View LinkedIn',
    github: 'View GitHub',
  },
  footer: { panel: 'Private panel' },
};

export const content: Record<Lang, Content> = { es, en };
