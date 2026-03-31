'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Code2, 
  Terminal, 
  User, 
  Briefcase, 
  Mail, 
  Github, 
  Linkedin, 
  Twitter,
  Moon,
  Sun,
  Globe,
  Menu,
  ChevronRight,
  Database,
  Layout,
  Server
} from 'lucide-react';
import { motion, animate, stagger } from 'motion/react';

const translations = {
  en: {
    nav: {
      about: 'About',
      skills: 'Skills',
      experience: 'Experience',
      projects: 'Projects',
      contact: 'Contact'
    },
    hero: {
      greeting: 'Hello, World! I am',
      role: 'Fullstack Developer & IT Infrastructure Specialist',
      description: 'UTN graduate with experience in process automation (n8n), VoIP architectures (Asterisk), and web development (TypeScript/FastAPI). Focused on scalable solutions that optimize technical operations and business performance.',
      viewWork: 'View My Work',
      contactMe: 'Contact Me',
      downloadCV: 'Download CV'
    },
    about: {
      title: 'About Me',
      p1: "Hello! I'm Gonza (Gonzalo Murguia), a Fullstack Developer and IT Infrastructure Specialist. I'm passionate about creating comprehensive technological solutions, from web development to server and network management.",
      p2: "Throughout my career, I've worked as a Freelance Technician, IT Administrator, and Software Engineer. I specialize in process automation, IP telephony modernization, and agile development. I always seek to optimize technical operations and business performance.",
      stats: {
        experience: 'Years Experience',
        projects: 'Projects Completed',
        clients: 'Happy Clients',
        awards: 'Certifications'
      }
    },
    skills: {
      title: 'Skills',
      frontend: 'Backend & Scripting',
      backend: 'Infrastructure',
      database: 'Communications & Tools'
    },
    experience: {
      title: 'Experience',
      present: 'Present',
      fulltime: 'Full-time',
      jobs: [
        {
          title: 'Freelance Technician',
          company: 'Self-Employed / Summit S.A.',
          desc: 'Developer of the "siendoHome" web application and IT Administrator. Specialized in technological infrastructure management (networks, Linux, Windows) and providing comprehensive technical support. Collaborated with Summit S.A. providing solutions for ecosystem optimization.',
          achievements: [
            'Developed and maintained the siendoHome web application',
            'Managed Linux and Windows server infrastructure',
            'Provided remote and on-site technical support'
          ]
        },
        {
          title: 'Software Engineer Intern',
          company: 'Summit',
          desc: 'Led the migration of VoIP infrastructure to PJSIP and optimized the Asterisk engine. Designed integration architectures between PBX and transcription APIs.',
          achievements: [
            'Eliminated critical failures and improved communication quality',
            'Automated data processing flows using Python (FastAPI) and n8n'
          ]
        },
        {
          title: 'Software Engineer',
          company: 'Insomnia Graphix',
          desc: 'Optimized delivery times in frontend projects and applications using Scrum, highlighting leadership in the Simple Clean project.',
          achievements: [
            'Elevated application stability by fixing critical bugs',
            'Ensured project scalability through technical documentation'
          ]
        }
      ]
    },
    projects: {
      title: 'Projects',
      desc: 'A brief description of the project. It highlights the main features and the problem it solves. Built with modern web technologies.',
      items: [
        {
          name: 'siendoHome',
          url: 'https://siendohome.com',
          desc: 'Web application developed to manage and optimize specific services. Built with a focus on scalability and performance.',
          tags: ['TypeScript', 'Node.js', 'Linux']
        },
        {
          name: 'ideon.ar',
          url: 'https://ideon.ar',
          desc: 'Comprehensive web platform providing technological solutions. Focuses on robust infrastructure and seamless user experience.',
          tags: ['Web Development', 'Infrastructure', 'FastAPI']
        }
      ]
    },
    contact: {
      title: 'Contact',
      getInTouch: 'Get In Touch',
      desc: "Although I'm not currently looking for any new opportunities, my inbox is always open. Whether you have a question or just want to say hi, I'll try my best to get back to you!",
      sayHello: 'Say Hello',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      send: 'Send Message'
    },
    footer: {
      rights: 'All rights reserved.',
      builtBy: 'Designed & Built by'
    }
  },
  es: {
    nav: {
      about: 'Sobre mí',
      skills: 'Habilidades',
      experience: 'Experiencia',
      projects: 'Proyectos',
      contact: 'Contacto'
    },
    hero: {
      greeting: '¡Hola Mundo! Soy',
      role: 'Desarrollador Fullstack & Especialista IT',
      description: 'Graduado en la UTN con experiencia en automatización de procesos (n8n), arquitecturas VoIP (Asterisk) y desarrollo web (TypeScript/FastAPI). Enfocado en soluciones escalables que optimizan la operatividad técnica y el rendimiento del negocio.',
      viewWork: 'Ver mi trabajo',
      contactMe: 'Contáctame',
      downloadCV: 'Descargar CV'
    },
    about: {
      title: 'Sobre mí',
      p1: "¡Hola! Soy Gonza (Gonzalo Murguia), un Desarrollador Fullstack y Especialista en Infraestructura IT. Me apasiona crear soluciones tecnológicas integrales, desde el desarrollo web hasta la gestión de servidores y redes.",
      p2: "A lo largo de mi carrera, he trabajado como Técnico Freelance, Administrador IT y Software Engineer. Me especializo en automatización de procesos, modernización de telefonía IP y desarrollo ágil. Siempre busco optimizar la operatividad técnica y el rendimiento del negocio.",
      stats: {
        experience: 'Años de Experiencia',
        projects: 'Proyectos Completados',
        clients: 'Clientes Felices',
        awards: 'Certificaciones'
      }
    },
    skills: {
      title: 'Habilidades',
      frontend: 'Backend & Scripting',
      backend: 'Infraestructura',
      database: 'Comunicaciones y Herramientas'
    },
    experience: {
      title: 'Experiencia',
      present: 'Presente',
      fulltime: 'Tiempo completo',
      jobs: [
        {
          title: 'Técnico Freelance',
          company: 'Independiente / Summit S.A.',
          desc: 'Desarrollador del aplicativo web "siendoHome" y Administrador IT. Me especializo en la gestión de infraestructura tecnológica (redes, Linux y Windows) y en brindar soporte técnico integral. Colaboré activamente con Summit S.A. aportando soluciones para la optimización de su ecosistema.',
          achievements: [
            'Desarrollo y mantenimiento de la aplicación web siendoHome',
            'Gestión de infraestructura de servidores Linux y Windows',
            'Soporte técnico integral remoto y presencial'
          ]
        },
        {
          title: 'Software Engineer Pasante',
          company: 'Summit',
          desc: 'Lideré la migración de infraestructura VoIP a PJSIP y la optimización del motor Asterisk. Diseñé la arquitectura de integración entre PBX y APIs de transcripción.',
          achievements: [
            'Eliminación de fallos críticos y mejora en la calidad de comunicaciones',
            'Automatización de flujos de datos utilizando Python (FastAPI) y n8n'
          ]
        },
        {
          title: 'Software Engineer',
          company: 'Insomnia Graphix',
          desc: 'Optimicé los tiempos de entrega en proyectos frontend y aplicaciones mediante Scrum, destacando el liderazgo en el proyecto Simple Clean.',
          achievements: [
            'Elevé la estabilidad de las aplicaciones corrigiendo errores críticos',
            'Aseguré la escalabilidad a través de documentación técnica'
          ]
        }
      ]
    },
    projects: {
      title: 'Proyectos',
      desc: 'Una breve descripción del proyecto. Destaca las características principales y el problema que resuelve. Construido con tecnologías web modernas.',
      items: [
        {
          name: 'siendoHome',
          url: 'https://siendohome.com',
          desc: 'Aplicación web desarrollada para gestionar y optimizar servicios específicos. Construida con un enfoque en escalabilidad y rendimiento.',
          tags: ['TypeScript', 'Node.js', 'Linux']
        },
        {
          name: 'ideon.ar',
          url: 'https://ideon.ar',
          desc: 'Plataforma web integral que proporciona soluciones tecnológicas. Se centra en una infraestructura robusta y una experiencia de usuario fluida.',
          tags: ['Web Development', 'Infrastructure', 'FastAPI']
        }
      ]
    },
    contact: {
      title: 'Contacto',
      getInTouch: 'Ponte en contacto',
      desc: "Aunque actualmente no estoy buscando nuevas oportunidades, mi bandeja de entrada siempre está abierta. Ya sea que tengas una pregunta o simplemente quieras saludar, ¡haré todo lo posible para responderte!",
      sayHello: 'Di Hola',
      name: 'Nombre',
      email: 'Correo',
      message: 'Mensaje',
      send: 'Enviar Mensaje'
    },
    footer: {
      rights: 'Todos los derechos reservados.',
      builtBy: 'Diseñado y Construido por'
    }
  }
};

const initialParticles = [...Array(10)].map((_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 10 + Math.random() * 10,
  text: ['{ }', '</>', '();', '=>'][Math.floor(Math.random() * 4)]
}));

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState<'en' | 'es'>('es');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    // Simulate loading
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!loading) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

      return () => observer.disconnect();
    }
  }, [loading]);

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (!loading) {
      animate('.hero-greeting, .hero-name, .hero-title, .hero-description, .hero-buttons, .hero-social', 
        { y: [50, 0], opacity: [0, 1] },
        { delay: stagger(0.1), duration: 1, ease: 'easeOut' }
      );

      animate('.hero-image-container', 
        { scale: [0.8, 1], opacity: [0, 1] },
        { duration: 1.5, delay: 0.5, type: 'spring', bounce: 0.4 }
      );
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-content">
          <div className="loader-code-text">
            <span className="code-line" data-line="1">import &#123; Portfolio &#125; from &apos;./developer&apos;;</span>
            <span className="code-line" data-line="2">const dev = new Portfolio();</span>
            <span className="code-line" data-line="3">await dev.initialize();</span>
            <span className="code-line" data-line="4">dev.render();</span>
          </div>
          <div className="loader-spinner-wrapper">
            <div className="loader-spinner"></div>
          </div>
          <div className="loader-progress-wrapper">
            <div className="loader-progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="loader-percentage">{progress}%</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-logo">
              <span className="logo-bracket">&lt;</span>
              <span className="logo-text">Dev</span>
              <span className="logo-bracket">/&gt;</span>
            </div>
          </div>
          
          <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <a href="#about" className="nav-link">
              <User size={16} /> {t.nav.about}
            </a>
            <a href="#skills" className="nav-link">
              <Code2 size={16} /> {t.nav.skills}
            </a>
            <a href="#projects" className="nav-link">
              <Briefcase size={16} /> {t.nav.projects}
            </a>
            <a href="#contact" className="nav-link">
              <Mail size={16} /> {t.nav.contact}
            </a>
          </nav>

          <div className="nav-controls">
            <button 
              className="lang-toggle" 
              onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
              aria-label="Toggle Language"
            >
              <Globe size={18} />
              <span className="uppercase">{lang}</span>
            </button>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        <section className="hero-section" id="home">
          <div className="hero-background">
            <div className="code-grid-bg"></div>
            <div className="floating-particles">
              {initialParticles.map((p) => (
                <div 
                  key={p.id} 
                  className="particle"
                  style={{
                    left: `${p.left}%`,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.duration}s`
                  }}
                >
                  {p.text}
                </div>
              ))}
            </div>
          </div>

          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-greeting">
                <Terminal size={20} />
                <span>{t.hero.greeting}</span>
                <span className="greeting-cursor">_</span>
              </div>
              
              <h1 className="hero-name">
                <span className="name-prefix">const</span>
                <span className="name-operator">developer =</span>
                <span className="name-value">&quot;Gonzalo Murguia&quot;</span>
                <span className="name-suffix">;</span>
              </h1>
              
              <h2 className="hero-title">
                <span className="title-prefix">{t.hero.role}</span>
              </h2>
              
              <p className="hero-description">
                {t.hero.description}
              </p>
              
              <div className="hero-buttons">
                <a href="#projects" className="btn btn-primary">
                  {t.hero.viewWork} <ChevronRight size={18} />
                </a>
                <a href="#contact" className="btn btn-secondary">
                  {t.hero.contactMe}
                </a>
                <a href="/cv.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-secondary border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--bg-dark)]">
                  {t.hero.downloadCV}
                </a>
              </div>
              
              <div className="hero-social">
                <a href="https://github.com/TheSortty" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="GitHub">
                  <Github size={24} />
                </a>
                <a href="https://www.linkedin.com/in/gonzalo-murguia-5135b23b4/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
                  <Linkedin size={24} />
                </a>
              </div>
            </div>

            <div className="hero-image-wrapper">
              <div className="hero-image-container">
                <div className="profile-image-glow"></div>
                <div className="profile-image-frame">
                  <div className="profile-image">
                    <User className="profile-placeholder" />
                  </div>
                </div>
                
                <div className="floating-badge badge-1">
                  <Layout />
                  <div className="badge-content">
                    <span className="badge-title">Backend</span>
                    <span className="badge-libs">Python, TypeScript</span>
                  </div>
                </div>
                
                <div className="floating-badge badge-2">
                  <Server />
                  <div className="badge-content">
                    <span className="badge-title">Infrastructure</span>
                    <span className="badge-libs">Linux, Docker</span>
                  </div>
                </div>
                
                <div className="floating-badge badge-3">
                  <Database />
                  <div className="badge-content">
                    <span className="badge-title">Comms</span>
                    <span className="badge-libs">Asterisk, VoIP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="scroll-indicator">
            <div className="scroll-mouse">
              <div className="scroll-wheel"></div>
            </div>
            <span>Scroll Down</span>
          </div>
        </section>

        <section className="section fade-in" id="about">
          <div className="section-container">
            <div className="section-header">
              <span className="section-number">01.</span>
              <h2 className="section-title">
                <span className="title-bracket">&lt;</span>
                <span className="title-text">{t.about.title}</span>
                <span className="title-bracket">/&gt;</span>
              </h2>
            </div>
            
            <div className="about-content grid md:grid-cols-2 gap-12">
              <div className="about-text text-lg text-[var(--text-secondary)] leading-relaxed">
                <p className="mb-6">
                  {t.about.p1}
                </p>
                <p>
                  {t.about.p2}
                </p>
              </div>
              <div className="about-stats grid grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="stat-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] text-center transition-transform hover:-translate-y-2"
                >
                  <h3 className="text-4xl font-bold text-[var(--primary)] mb-2">4+</h3>
                  <p className="text-[var(--text-secondary)]">{t.about.stats.experience}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="stat-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] text-center transition-transform hover:-translate-y-2"
                >
                  <h3 className="text-4xl font-bold text-[var(--cyan)] mb-2">10+</h3>
                  <p className="text-[var(--text-secondary)]">{t.about.stats.projects}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="stat-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] text-center transition-transform hover:-translate-y-2"
                >
                  <h3 className="text-4xl font-bold text-[var(--accent)] mb-2">15+</h3>
                  <p className="text-[var(--text-secondary)]">{t.about.stats.clients}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="stat-card bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] text-center transition-transform hover:-translate-y-2"
                >
                  <h3 className="text-4xl font-bold text-[var(--green)] mb-2">2+</h3>
                  <p className="text-[var(--text-secondary)]">{t.about.stats.awards}</p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="section fade-in" id="skills">
          <div className="section-container">
            <div className="section-header">
              <span className="section-number">02.</span>
              <h2 className="section-title">
                <span className="title-bracket">&lt;</span>
                <span className="title-text">{t.skills.title}</span>
                <span className="title-bracket">/&gt;</span>
              </h2>
            </div>
            
            <div className="skills-grid grid md:grid-cols-3 gap-8">
              <div className="skill-category bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)]">
                <h3 className="category-title text-xl font-bold mb-6 text-[var(--text-primary)] flex items-center gap-3">
                  <Layout className="text-[var(--primary)]" /> {t.skills.frontend}
                </h3>
                <div className="space-y-4">
                  <div className="skill-item">
                    <div className="flex justify-between mb-2">
                      <span>Python (FastAPI)</span>
                      <span className="text-[var(--primary)]">90%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--gradient-1)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '90%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="skill-item">
                    <div className="flex justify-between mb-2">
                      <span>TypeScript / Node.js</span>
                      <span className="text-[var(--primary)]">85%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--gradient-1)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '85%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="skill-item">
                    <div className="flex justify-between mb-2">
                      <span>n8n (Automation)</span>
                      <span className="text-[var(--primary)]">95%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--gradient-1)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '95%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="skill-category bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)]">
                <h3 className="category-title text-xl font-bold mb-6 text-[var(--text-primary)] flex items-center gap-3">
                  <Server className="text-[var(--cyan)]" /> {t.skills.backend}
                </h3>
                <div className="space-y-4">
                  <div className="skill-item">
                    <div className="flex justify-between mb-2">
                      <span>Linux / Windows Server</span>
                      <span className="text-[var(--cyan)]">90%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--gradient-2)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '90%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="skill-item">
                    <div className="flex justify-between mb-2">
                      <span>Docker / Networking</span>
                      <span className="text-[var(--cyan)]">85%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--gradient-2)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '85%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="skill-item">
                    <div className="flex justify-between mb-2">
                      <span>Pterodactyl</span>
                      <span className="text-[var(--cyan)]">80%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--gradient-2)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '80%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="skill-category bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)]">
                <h3 className="category-title text-xl font-bold mb-6 text-[var(--text-primary)] flex items-center gap-3">
                  <Database className="text-[var(--green)]" /> {t.skills.database}
                </h3>
                <div className="space-y-4">
                  <div className="skill-item">
                    <div className="flex justify-between mb-2">
                      <span>VoIP / Asterisk</span>
                      <span className="text-[var(--green)]">95%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--gradient-3)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '95%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="skill-item">
                    <div className="flex justify-between mb-2">
                      <span>Issabel / PJSIP</span>
                      <span className="text-[var(--green)]">90%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--gradient-3)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '90%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="skill-item">
                    <div className="flex justify-between mb-2">
                      <span>Git / SQL</span>
                      <span className="text-[var(--green)]">85%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-[var(--gradient-3)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '85%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section fade-in" id="experience">
          <div className="section-container">
            <div className="section-header">
              <span className="section-number">03.</span>
              <h2 className="section-title">
                <span className="title-bracket">&lt;</span>
                <span className="title-text">{t.experience.title}</span>
                <span className="title-bracket">/&gt;</span>
              </h2>
            </div>
            
            <div className="timeline">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="timeline-item"
              >
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-year">2021 - {t.experience.present}</span>
                    <span className="timeline-badge">{t.experience.fulltime}</span>
                  </div>
                  <h3 className="timeline-title">{t.experience.jobs[0].title}</h3>
                  <div className="timeline-company">
                    <Briefcase size={16} /> {t.experience.jobs[0].company}
                  </div>
                  <p className="timeline-description">
                    {t.experience.jobs[0].desc}
                  </p>
                  <div className="timeline-achievements">
                    {t.experience.jobs[0].achievements.map((ach, i) => (
                      <div key={i} className="achievement-item">
                        <ChevronRight size={16} className="text-[var(--green)]" />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                  <div className="timeline-tags">
                    <span className="tag">Python</span>
                    <span className="tag">FastAPI</span>
                    <span className="tag">n8n</span>
                    <span className="tag">Asterisk</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="timeline-item"
              >
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-year">2018 - 2021</span>
                    <span className="timeline-badge">{t.experience.fulltime}</span>
                  </div>
                  <h3 className="timeline-title">{t.experience.jobs[1].title}</h3>
                  <div className="timeline-company">
                    <Briefcase size={16} /> {t.experience.jobs[1].company}
                  </div>
                  <p className="timeline-description">
                    {t.experience.jobs[1].desc}
                  </p>
                  <div className="timeline-achievements">
                    {t.experience.jobs[1].achievements.map((ach, i) => (
                      <div key={i} className="achievement-item">
                        <ChevronRight size={16} className="text-[var(--green)]" />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                  <div className="timeline-tags">
                    <span className="tag">TypeScript</span>
                    <span className="tag">React</span>
                    <span className="tag">Node.js</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="section fade-in" id="projects">
          <div className="section-container">
            <div className="section-header">
              <span className="section-number">04.</span>
              <h2 className="section-title">
                <span className="title-bracket">&lt;</span>
                <span className="title-text">{t.projects.title}</span>
                <span className="title-bracket">/&gt;</span>
              </h2>
            </div>
            
            <div className="projects-grid grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              {t.projects.items.map((project, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="project-card bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden group hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className="project-image h-48 bg-[var(--bg-hover)] relative overflow-hidden">
                    <div className="project-placeholder">
                      <Code2 size={48} className="text-[var(--primary)] opacity-50" />
                    </div>
                    <div className="project-overlay">
                      <div className="project-links">
                        <a href={`https://${project.url}`} target="_blank" rel="noopener noreferrer" className="project-link" aria-label="Live Demo"><Globe size={20} /></a>
                      </div>
                    </div>
                  </div>
                  <div className="project-content p-6">
                    <h3 className="project-title text-xl font-bold text-[var(--text-primary)] mb-4">{project.name}</h3>
                    <p className="project-description text-[var(--text-secondary)] mb-6 line-clamp-3">
                      {project.desc}
                    </p>
                    <div className="project-tags">
                      {project.tags.map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="section fade-in" id="contact">
          <div className="section-container">
            <div className="section-header">
              <span className="section-number">05.</span>
              <h2 className="section-title">
                <span className="title-bracket">&lt;</span>
                <span className="title-text">{t.contact.title}</span>
                <span className="title-bracket">/&gt;</span>
              </h2>
            </div>
            
            <div className="contact-content">
              <div className="contact-info">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="contact-item"
                >
                  <div className="contact-icon">
                    <Mail size={24} />
                  </div>
                  <div className="contact-details">
                    <span className="contact-label">Email</span>
                    <a href="mailto:gonzalo.d.murguia@gmail.com" className="contact-value">gonzalo.d.murguia@gmail.com</a>
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="contact-item"
                >
                  <div className="contact-icon">
                    <Linkedin size={24} />
                  </div>
                  <div className="contact-details">
                    <span className="contact-label">LinkedIn</span>
                    <a href="https://www.linkedin.com/in/gonzalo-murguia-5135b23b4/" target="_blank" rel="noopener noreferrer" className="contact-value">linkedin.com/in/gonzalo-murguia</a>
                  </div>
                </motion.div>
              </div>
              
              <motion.form 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="contact-form" 
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="form-group">
                  <input type="text" className="form-input" placeholder={t.contact.name} required />
                </div>
                <div className="form-group">
                  <input type="email" className="form-input" placeholder={t.contact.email} required />
                </div>
                <div className="form-group">
                  <textarea className="form-input form-textarea" placeholder={t.contact.message} required></textarea>
                </div>
                <button type="submit" className="btn btn-primary btn-submit">
                  {t.contact.send} <ChevronRight size={18} />
                </button>
              </motion.form>
            </div>
          </div>
        </section>

        <footer className="main-footer">
          <div className="footer-container">
            <div className="footer-content flex-col md:flex-row gap-6">
              <div className="footer-text-wrapper">
                <div className="footer-text">
                  <span className="footer-copyright">© {new Date().getFullYear()} Gonzalo Murguia.</span>
                  <span className="footer-divider">|</span>
                  <span className="footer-built">{t.footer.rights}</span>
                </div>
                <div className="footer-author">
                  <span className="footer-by-text">{t.footer.builtBy}</span>
                  <a href="https://github.com/TheSortty" target="_blank" rel="noopener noreferrer" className="footer-author-link">
                    <Code2 size={14} /> Gonzalo Murguia
                  </a>
                </div>
              </div>
              <div className="footer-social">
                <a href="https://github.com/TheSortty" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="GitHub"><Github size={20} /></a>
                <a href="https://www.linkedin.com/in/gonzalo-murguia-5135b23b4/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="LinkedIn"><Linkedin size={20} /></a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
