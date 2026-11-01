import React from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

const OFFICIAL_NEXUS_LOGO = '/assets/aistudio/768420689_122100971391434882_47020785483964272_n__1__df72d03a.jpg';

interface FooterProps {
  onNavClick?: (section: 'inicio' | 'proyectos' | 'nosotros' | 'contactanos') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick }) => {
  const WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=573043470984&text=Hola%20Nexus%20Web%20Studio!%20Me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n.';

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/profile.php?id=61593046477590',
      color: 'hover:text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/nexuswebstudio',
      color: 'hover:text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/40',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    {
      name: 'X (Twitter)',
      url: 'https://x.com/nexuswebstudio',
      color: 'hover:text-white hover:bg-slate-800 hover:border-slate-600',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: 'TikTok',
      url: 'https://tiktok.com/@nexuswebstudio',
      color: 'hover:text-[#00F2FE] hover:bg-[#00F2FE]/10 hover:border-[#00F2FE]/40',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .56.04.82.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.12z"/>
        </svg>
      ),
    },
    {
      name: 'Threads',
      url: 'https://threads.net/@nexuswebstudio',
      color: 'hover:text-purple-300 hover:bg-purple-950/60 hover:border-purple-600/40',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.186 24h-.007c-3.582-.024-6.334-1.2-8.18-3.496C2.203 18.257 1.34 15.176 1.433 11.33c.123-5.077 2.015-8.877 5.623-11.3 2.507-1.683 5.565-2.22 9.098-1.597 4.09.722 7.15 3.332 8.618 7.348 1.05 2.87.973 6.27-.215 9.576-.718 1.996-1.87 3.67-3.43 4.97-1.747 1.455-3.87 2.196-6.31 2.202h-.057c-2.482-.01-4.577-.852-6.228-2.503-1.48-1.48-2.23-3.437-2.23-5.816 0-2.45.81-4.47 2.41-6.01 1.62-1.55 3.73-2.34 6.28-2.34.61 0 1.25.05 1.9.15v2.24c-.58-.1-1.15-.15-1.7-.15-1.85 0-3.35.54-4.47 1.62-1.1 1.05-1.65 2.47-1.65 4.22 0 1.7.53 3.08 1.58 4.12 1.13 1.12 2.6 1.7 4.38 1.71 1.75 0 3.25-.52 4.46-1.54 1.14-.96 1.98-2.24 2.5-3.8.94-2.82.99-5.46.14-7.85-1.12-3.13-3.48-5.16-6.63-5.71-2.8-.49-5.18-.08-7.07 1.18-2.77 1.84-4.22 4.82-4.32 8.86-.08 3.24.63 5.8 2.11 7.62 1.41 1.75 3.52 2.65 6.27 2.67h.007c2.4 0 4.45-.72 6.09-2.15l1.45 1.65c-2.02 1.76-4.57 2.65-7.58 2.65z"/>
        </svg>
      ),
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@NexusWebStudio',
      color: 'hover:text-[#FF0000] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/40',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
    {
      name: 'WhatsApp',
      url: WHATSAPP_URL,
      color: 'hover:text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/40',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.019 4.842-1.27.001-.002z"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Top Grid: Brand & Contact & Socials */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-8 border-b border-slate-800/80">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-cyan-500/40 shadow-sm bg-white p-0.5">
                <img src={OFFICIAL_NEXUS_LOGO} alt="Nexus Web Studio Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">Nexus Web Studio</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Agencia especializada en Arquitectura Web SaaS y Aplicaciones Móviles de alto rendimiento. Transformamos ideas en código desplegado.
            </p>
          </div>

          {/* Direct Contact Info */}
          <div className="md:col-span-3 space-y-2 text-center md:text-left">
            <p className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">Contacto Directo</p>
            <div className="space-y-1 text-xs text-slate-300">
              <p className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 transition-colors">
                  +57 304 347 0984
                </a>
              </p>
              <p className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <a href="mailto:nexuswebstudio2026@gmail.com" className="hover:text-cyan-300 transition-colors">
                  nexuswebstudio2026@gmail.com
                </a>
              </p>
            </div>
          </div>

          {/* Social Media Networks Icons Row */}
          <div className="md:col-span-4 flex flex-col items-center md:items-end space-y-3">
            <p className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">Síguenos en Redes Sociales</p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visitar ${social.name} de Nexus Web Studio`}
                  title={`Nexus Web Studio en ${social.name}`}
                  className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 transition-all transform hover:-translate-y-1 ${social.color}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Rights Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© 2026 Nexus Web Studio. Todos los derechos reservados.</span>
            <span className="hidden sm:inline">•</span>
            <a
              href="https://www.google.com/business/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:border-emerald-600 transition-colors inline-flex items-center gap-1 font-mono text-[10px]"
            >
              <span>Google Business Profile (Verificado)</span>
            </a>
            <a
              href="/llms.txt"
              target="_blank"
              className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 hover:border-purple-600 transition-colors inline-flex items-center gap-1 font-mono text-[10px]"
            >
              <span>LLMS.txt Especificación IA</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Términos de Servicio</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Política de Privacidad</span>
            <span>•</span>
            <span className="text-slate-500 font-mono text-[10px]">Google Search Console Verified</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
